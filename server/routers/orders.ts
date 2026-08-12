import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createOrderSchema, updateOrderSchema, createOrderItemSchema, updateOrderItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { orders, orderItems, products, stockMovements } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const ordersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orders).orderBy(orders.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(orders).where(eq(orders.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Pedido não encontrado");
    return result[0];
  }),

  getItems: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orderItems).where(eq(orderItems.orderId, opts.input.id));
  }),

  create: protectedProcedure.input(createOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input as any;
    data.userId = userId;
    const result = await db.insert(orders).values(data);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(orders).set(data as any).where(eq(orders.id, id));
    return { success: true };
  }),

  updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]) })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const order = await db.select().from(orders).where(eq(orders.id, opts.input.id)).limit(1);
    if (order.length === 0) throw new Error("Pedido não encontrado");
    const currentOrder = order[0] as any;
    const previousStatus = currentOrder.status;
    await db.update(orders).set({ status: opts.input.status }).where(eq(orders.id, opts.input.id));

    // If transitioning to 'cancelado', restore stock
    if (opts.input.status === "cancelado" && previousStatus !== "cancelado") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, opts.input.id));
      for (const item of items) {
        const currentProduct = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (currentProduct.length > 0) {
          const newStock = currentProduct[0].stockQuantity + item.quantity;
          await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, item.productId));
        }
        await db.insert(stockMovements).values({
          productId: item.productId,
          type: "entrada",
          quantity: item.quantity,
          referenceType: "order_cancel",
          referenceId: opts.input.id,
          notes: `Estorno - Cancelamento do pedido #${opts.input.id}`,
        });
      }
    }

    // If transitioning from 'cancelado' to active, deduct stock
    if (previousStatus === "cancelado" && opts.input.status !== "cancelado") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, opts.input.id));
      for (const item of items) {
        const currentProduct = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (currentProduct.length > 0) {
          const newStock = Math.max(0, currentProduct[0].stockQuantity - item.quantity);
          await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, item.productId));
        }
        await db.insert(stockMovements).values({
          productId: item.productId,
          type: "saida",
          quantity: item.quantity,
          referenceType: "order",
          referenceId: opts.input.id,
          notes: `Saída pelo pedido #${opts.input.id}`,
        });
      }
    }

    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(orderItems).where(eq(orderItems.orderId, opts.input.id));
    await db.delete(orders).where(eq(orders.id, opts.input.id));
    return { success: true };
  }),

  addItem: protectedProcedure.input(createOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, quantity, unitPrice, ...rest } = opts.input;
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);
    const p = parseFloat(unitPrice);
    const squareMeters = (w * h) / 10000;
    const subtotal = q * squareMeters * p;
    const result = await db.insert(orderItems).values({
      ...rest,
      width,
      height,
      quantity: q,
      unitPrice,
      squareMeters: String(squareMeters.toFixed(4)),
      subtotal: String(subtotal.toFixed(2)),
    });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, opts.input.orderId));
    const total = items.reduce((sum: number, item: any) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(orders.id, opts.input.orderId));
    return { success: true, insertId: result[0].insertId };
  }),

  updateItem: protectedProcedure.input(updateOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const currentItem = item[0] as any;
    const w = width ? parseFloat(width) : parseFloat(String(currentItem.width));
    const h = height ? parseFloat(height) : parseFloat(String(currentItem.height));
    const q = quantity ? parseInt(quantity) : currentItem.quantity;
    const p = unitPrice ? parseFloat(unitPrice) : parseFloat(String(currentItem.unitPrice));
    const squareMeters = (w * h) / 10000;
    const subtotal = q * squareMeters * p;
    const data: Record<string, unknown> = { ...rest };
    if (width) data.width = width;
    if (height) data.height = height;
    if (quantity) data.quantity = q;
    if (unitPrice) data.unitPrice = unitPrice;
    data.squareMeters = String(squareMeters.toFixed(4));
    data.subtotal = String(subtotal.toFixed(2));
    await db.update(orderItems).set(data).where(eq(orderItems.id, id));
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, currentItem.orderId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(orders.id, currentItem.orderId));
    return { success: true };
  }),

  deleteItem: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(orderItems).where(eq(orderItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const orderId = (item[0] as any).orderId;
    await db.delete(orderItems).where(eq(orderItems.id, opts.input.id));
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(orders.id, orderId));
    return { success: true };
  }),
});
