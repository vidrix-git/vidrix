import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createQuoteSchema, updateQuoteSchema, createQuoteItemSchema, updateQuoteItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { quotes, quoteItems, orders, orderItems, stockMovements, products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const quotesRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(quotes).orderBy(quotes.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(quotes).where(eq(quotes.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Orçamento não encontrado");
    return result[0];
  }),

  getItems: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(quoteItems).where(eq(quoteItems.quoteId, opts.input.id));
  }),

  create: protectedProcedure.input(createQuoteSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input as any;
    data.userId = userId;
    if (data.validUntil) {
      data.validUntil = new Date(data.validUntil);
    } else {
      delete data.validUntil;
    }
    const result = await db.insert(quotes).values(data);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateQuoteSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    const updateData = data as any;
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }
    await db.update(quotes).set(updateData).where(eq(quotes.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, opts.input.id));
    await db.delete(quotes).where(eq(quotes.id, opts.input.id));
    return { success: true };
  }),

  addItem: protectedProcedure.input(createQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, quantity, unitPrice, ...rest } = opts.input;
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);
    const p = parseFloat(unitPrice);
    const squareMeters = (w * h) / 10000;
    const subtotal = q * squareMeters * p;
    const result = await db.insert(quoteItems).values({
      ...rest,
      width,
      height,
      quantity: q,
      unitPrice,
      squareMeters: String(squareMeters.toFixed(4)),
      subtotal: String(subtotal.toFixed(2)),
    });
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, opts.input.quoteId));
    const total = items.reduce((sum: number, item: any) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq(quotes.id, opts.input.quoteId));
    return { success: true, insertId: result[0].insertId };
  }),

  updateItem: protectedProcedure.input(updateQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = await db.select().from(quoteItems).where(eq(quoteItems.id, id)).limit(1);
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
    await db.update(quoteItems).set(data).where(eq(quoteItems.id, id));
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, currentItem.quoteId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq(quotes.id, currentItem.quoteId));
    return { success: true };
  }),

  deleteItem: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(quoteItems).where(eq(quoteItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const quoteId = (item[0] as any).quoteId;
    await db.delete(quoteItems).where(eq(quoteItems.id, opts.input.id));
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
    const total = items.reduce((sum: number, it: any) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq(quotes.id, quoteId));
    return { success: true };
  }),

  convertToOrder: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const quoteList = await db.select().from(quotes).where(eq(quotes.id, opts.input.id)).limit(1);
    if (quoteList.length === 0) throw new Error("Orçamento não encontrado");
    const q = quoteList[0] as any;
    const orderResult = await db.insert(orders).values({
      clientId: q.clientId,
      userId: q.userId,
      quoteId: q.id,
      status: "aprovado",
      totalAmount: q.totalAmount,
    });
    const orderId = orderResult[0].insertId;
    const quoteItemsList = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, q.id));
    for (const qi of quoteItemsList) {
      await db.insert(orderItems).values({
        orderId,
        productId: qi.productId,
        width: qi.width,
        height: qi.height,
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        squareMeters: qi.squareMeters,
        subtotal: qi.subtotal,
      });
      const currentProduct = await db.select().from(products).where(eq(products.id, qi.productId)).limit(1);
      if (currentProduct.length > 0) {
        const newStock = currentProduct[0].stockQuantity - qi.quantity;
        await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, qi.productId));
      }
      await db.insert(stockMovements).values({
        productId: qi.productId,
        type: "saida",
        quantity: qi.quantity,
        referenceType: "order",
        referenceId: orderId,
        notes: `Saída pelo pedido #${orderId}`,
      });
    }
    await db.update(quotes).set({ status: "convertido" }).where(eq(quotes.id, q.id));
    return { success: true, orderId };
  }),
});
