import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createQuoteSchema, updateQuoteSchema, createQuoteItemSchema, updateQuoteItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { quotes, quoteItems, orders, orderItems, stockMovements, products } from "../../drizzle/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { calculateCommercialItem, roundMoney, roundSquareMeters } from "../commercial-rules";

function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result as any;
  return Number((header as any)?.affectedRows || 0);
}

async function refreshQuoteTotal(tx: any, quoteId: number) {
  const items = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  const total = items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
  await tx.update(quotes).set({ totalAmount: roundMoney(total) }).where(eq(quotes.id, quoteId));
}

async function requireVisibleQuote(db: any, quoteId: number, user: { id: number; role: string } | null | undefined) {
  const criteria = user?.role === "seller"
    ? and(eq(quotes.id, quoteId), eq(quotes.userId, user.id))
    : eq(quotes.id, quoteId);
  const result = await db.select().from(quotes).where(criteria).limit(1);
  if (result.length === 0) throw new Error("Orçamento não encontrado");
  return result[0] as any;
}

export const quotesRouter = router({
  list: protectedProcedure.query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (opts.ctx.user?.role === "seller") {
      return db.select().from(quotes).where(eq(quotes.userId, opts.ctx.user.id)).orderBy(quotes.createdAt);
    }
    return db.select().from(quotes).orderBy(quotes.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return requireVisibleQuote(db, opts.input.id, opts.ctx.user);
  }),

  getItems: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await requireVisibleQuote(db, opts.input.id, opts.ctx.user);
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
    await requireVisibleQuote(db, id, opts.ctx.user);
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
    const quote = await requireVisibleQuote(db, opts.input.id, opts.ctx.user);
    if (quote.status === "convertido") throw new Error("Orçamento convertido não pode ser excluído");
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, opts.input.id));
    await db.delete(quotes).where(eq(quotes.id, opts.input.id));
    return { success: true };
  }),

  addItem: protectedProcedure.input(createQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await requireVisibleQuote(db, opts.input.quoteId, opts.ctx.user);
    const { width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = calculateCommercialItem({ width, height, quantity, unitPrice });
    const result = await db.insert(quoteItems).values({
      ...rest,
      width: String(item.width),
      height: String(item.height),
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      squareMeters: roundSquareMeters(item.squareMeters),
      subtotal: roundMoney(item.subtotal),
    });
    await refreshQuoteTotal(db, opts.input.quoteId);
    return { success: true, insertId: result[0].insertId };
  }),

  updateItem: protectedProcedure.input(updateQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = await db.select().from(quoteItems).where(eq(quoteItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const currentItem = item[0] as any;
    await requireVisibleQuote(db, currentItem.quoteId, opts.ctx.user);
    const calculated = calculateCommercialItem({
      width: width ?? String(currentItem.width),
      height: height ?? String(currentItem.height),
      quantity: quantity ?? String(currentItem.quantity),
      unitPrice: unitPrice ?? String(currentItem.unitPrice),
    });
    const data: Record<string, unknown> = { ...rest };
    if (width !== undefined) data.width = String(calculated.width);
    if (height !== undefined) data.height = String(calculated.height);
    if (quantity !== undefined) data.quantity = calculated.quantity;
    if (unitPrice !== undefined) data.unitPrice = String(calculated.unitPrice);
    data.squareMeters = roundSquareMeters(calculated.squareMeters);
    data.subtotal = roundMoney(calculated.subtotal);
    await db.update(quoteItems).set(data).where(eq(quoteItems.id, id));
    await refreshQuoteTotal(db, currentItem.quoteId);
    return { success: true };
  }),

  deleteItem: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(quoteItems).where(eq(quoteItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item não encontrado");
    const quoteId = (item[0] as any).quoteId;
    await requireVisibleQuote(db, quoteId, opts.ctx.user);
    await db.delete(quoteItems).where(eq(quoteItems.id, opts.input.id));
    await refreshQuoteTotal(db, quoteId);
    return { success: true };
  }),

  convertToOrder: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM quotes WHERE id = ${opts.input.id} FOR UPDATE`);
      const quoteList = await tx.select().from(quotes).where(eq(quotes.id, opts.input.id)).limit(1);
      if (quoteList.length === 0) throw new Error("Orçamento não encontrado");
      const quote = quoteList[0] as any;
      const existingOrder = await tx.select().from(orders).where(eq(orders.quoteId, quote.id)).limit(1);
      if (existingOrder.length > 0) return { success: true, orderId: existingOrder[0].id, alreadyConverted: true };
      if (quote.status !== "aprovado") throw new Error("Apenas orçamentos aprovados podem ser convertidos");
      const sourceItems = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
      if (sourceItems.length === 0) throw new Error("O orçamento não possui itens para conversão");
      const quantities = new Map<number, number>();
      for (const item of sourceItems) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
      for (const [productId, quantity] of Array.from(quantities.entries())) {
        await tx.execute(sql`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`);
        const result = await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` }).where(and(eq(products.id, productId), gte(products.stockQuantity, quantity)));
        if (affectedRows(result) !== 1) throw new Error(`Estoque insuficiente para o produto #${productId}`);
      }
      const orderResult = await tx.insert(orders).values({ clientId: quote.clientId, userId: quote.userId, quoteId: quote.id, status: "aprovado", totalAmount: quote.totalAmount, stockAllocatedAt: new Date() });
      const orderId = orderResult[0].insertId;
      for (const item of sourceItems) {
        await tx.insert(orderItems).values({ orderId, productId: item.productId, width: item.width, height: item.height, quantity: item.quantity, unitPrice: item.unitPrice, squareMeters: item.squareMeters, subtotal: item.subtotal });
        await tx.insert(stockMovements).values({ productId: item.productId, type: "saida", quantity: item.quantity, referenceType: "order", referenceId: orderId, notes: `Reserva pelo pedido #${orderId}` });
      }
      await tx.update(quotes).set({ status: "convertido" }).where(eq(quotes.id, quote.id));
      return { success: true, orderId, alreadyConverted: false };
    });
  }),
});
