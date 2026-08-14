import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, createPurchaseOrderItemSchema, updatePurchaseOrderItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { purchaseOrders, purchaseOrderItems, products, stockMovements } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export const purchaseOrdersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(purchaseOrders).orderBy(purchaseOrders.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Pedido de compra não encontrado");
    return result[0];
  }),

  getItems: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.id));
  }),

  create: adminProcedure.input(createPurchaseOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input as any;
    data.userId = userId;
    if (data.expectedDeliveryDate) {
      data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    } else {
      delete data.expectedDeliveryDate;
    }
    const result = await db.insert(purchaseOrders).values(data);
    return { success: true, insertId: result[0].insertId };
  }),

  update: adminProcedure.input(updatePurchaseOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    const updateData = data as any;
    if (updateData.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = new Date(updateData.expectedDeliveryDate);
    }
    await db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, id));
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.id));
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, opts.input.id));
    return { success: true };
  }),

  addItem: adminProcedure.input(createPurchaseOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { quantity, unitCost, ...rest } = opts.input;
    const q = parseInt(quantity);
    const c = parseFloat(unitCost);
    const subtotal = q * c;
    const result = await db.insert(purchaseOrderItems).values({
      ...rest,
      quantity: q,
      unitCost,
      subtotal: String(subtotal.toFixed(2)),
    });
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.purchaseOrderId));
    const total = items.reduce((sum: number, item: any) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(purchaseOrders.id, opts.input.purchaseOrderId));
    return { success: true, insertId: result[0].insertId };
  }),

  updateItem: adminProcedure.input(updatePurchaseOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, quantity, unitCost, ...rest } = opts.input;
    const item = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const currentItem = item[0] as any;
    const q = quantity ? parseInt(quantity) : currentItem.quantity;
    const c = unitCost ? parseFloat(unitCost) : parseFloat(String(currentItem.unitCost));
    const subtotal = q * c;
    const data: Record<string, unknown> = { ...rest };
    if (quantity) data.quantity = q;
    if (unitCost) data.unitCost = unitCost;
    data.subtotal = String(subtotal.toFixed(2));
    await db.update(purchaseOrderItems).set(data).where(eq(purchaseOrderItems.id, id));
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, currentItem.purchaseOrderId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(purchaseOrders.id, currentItem.purchaseOrderId));
    return { success: true };
  }),

  deleteItem: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const poId = (item[0] as any).purchaseOrderId;
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.id, opts.input.id));
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq(purchaseOrders.id, poId));
    return { success: true };
  }),

  receive: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM purchaseOrders WHERE id = ${opts.input.id} FOR UPDATE`);
      const po = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, opts.input.id)).limit(1);
      if (po.length === 0) throw new Error("Pedido de compra não encontrado");
      if (po[0].status === "recebido") return { success: true, alreadyReceived: true };
      if (po[0].status === "cancelado") throw new Error("Pedido de compra cancelado não pode ser recebido");

      const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.id));
      if (items.length === 0) throw new Error("Inclua ao menos um item antes de receber o pedido de compra");

      for (const item of items as any[]) {
        await tx.execute(sql`SELECT id FROM products WHERE id = ${item.productId} FOR UPDATE`);
        const result = await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
        const header = Array.isArray(result) ? result[0] as any : result as any;
        if (Number(header?.affectedRows ?? 0) !== 1) throw new Error(`Produto #${item.productId} não encontrado para recebimento`);
        await tx.insert(stockMovements).values({
          productId: item.productId,
          type: "entrada",
          quantity: item.quantity,
          referenceType: "purchase_order",
          referenceId: opts.input.id,
          notes: `Entrada pelo pedido de compra #${opts.input.id}`,
        });
      }
      await tx.update(purchaseOrders).set({ status: "recebido" }).where(eq(purchaseOrders.id, opts.input.id));
      return { success: true, alreadyReceived: false };
    });
  }),
});
