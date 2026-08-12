import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, createPurchaseOrderItemSchema, updatePurchaseOrderItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { purchaseOrders, purchaseOrderItems, products, stockMovements } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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

  create: protectedProcedure.input(createPurchaseOrderSchema).mutation(async (opts) => {
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

  update: protectedProcedure.input(updatePurchaseOrderSchema).mutation(async (opts) => {
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

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.id));
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, opts.input.id));
    return { success: true };
  }),

  addItem: protectedProcedure.input(createPurchaseOrderItemSchema).mutation(async (opts) => {
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

  updateItem: protectedProcedure.input(updatePurchaseOrderItemSchema).mutation(async (opts) => {
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

  deleteItem: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
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

  receive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, opts.input.id)).limit(1);
    if (po.length === 0) throw new Error("Pedido de compra não encontrado");
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, opts.input.id));
    for (const item of items as any[]) {
      // Add stock
      const currentProduct = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (currentProduct.length > 0) {
        const newStock = currentProduct[0].stockQuantity + item.quantity;
        await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, item.productId));
      }
      // Stock movement
      await db.insert(stockMovements).values({
        productId: item.productId,
        type: "entrada",
        quantity: item.quantity,
        referenceType: "purchase_order",
        referenceId: opts.input.id,
        notes: `Entrada pelo pedido de compra #${opts.input.id}`,
      });
    }
    await db.update(purchaseOrders).set({ status: "recebido" }).where(eq(purchaseOrders.id, opts.input.id));
    return { success: true };
  }),
});
