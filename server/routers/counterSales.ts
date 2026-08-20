import { z } from "zod";
import { and, eq, gte, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { createCounterSaleSchema, finalizeCounterTransactionSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { clients, commercialExtras, orderItems, orders, products, quoteItems, quotes, stockMovements } from "../../drizzle/schema";
import { calculateCommercialItem, roundMoney, roundSquareMeters } from "../commercial-rules";

function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result as any;
  return Number((header as any)?.affectedRows || 0);
}

type CounterTransactionInput = z.infer<typeof finalizeCounterTransactionSchema>;

function parseCommercialExtraNumber(value: string, field: string) {
  const compact = value.trim().replace(/\s+/g, "");
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} inválido`);
  return parsed;
}

async function finalizeCounterTransaction(ctx: any, input: CounterTransactionInput) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  return db.transaction(async (tx) => {
    const calculatedItems = input.items.map((item) => ({ ...item, calculated: calculateCommercialItem(item) }));
    const calculatedExtras = input.extras.map((extra) => {
      const quantity = parseCommercialExtraNumber(extra.quantity, "Quantidade do complemento");
      const unitPrice = parseCommercialExtraNumber(extra.unitPrice, "Preço do complemento");
      if (quantity <= 0) throw new Error("Quantidade do complemento deve ser positiva");
      return { ...extra, quantity, unitPrice, subtotal: quantity * unitPrice };
    });
    const totalAmount = roundMoney(
      calculatedItems.reduce((total, item) => total + item.calculated.subtotal, 0)
      + calculatedExtras.reduce((total, extra) => total + extra.subtotal, 0),
    );
    const userId = ctx.user?.id ?? 0;
    const selectedClient = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (selectedClient.length === 0) throw new Error("Cliente selecionado não foi encontrado; cadastre ou escolha um cliente válido para concluir o atendimento");

    if (input.outcome === "quote") {
      const quoteResult = await tx.insert(quotes).values({
        clientId: input.clientId,
        userId,
        status: "rascunho",
        totalAmount: String(totalAmount),
        notes: input.notes ? `[BALCÃO] ${input.notes}` : "[BALCÃO] Atendimento salvo como orçamento",
      });
      const quoteId = quoteResult[0].insertId;
      for (const item of calculatedItems) {
        await tx.insert(quoteItems).values({
          quoteId,
          productId: item.productId,
          width: String(item.calculated.width),
          height: String(item.calculated.height),
          quantity: item.calculated.quantity,
          unitPrice: String(item.calculated.unitPrice),
          squareMeters: roundSquareMeters(item.calculated.squareMeters),
          subtotal: roundMoney(item.calculated.subtotal),
          notes: item.notes,
        });
      }
      for (const extra of calculatedExtras) {
        await tx.insert(commercialExtras).values({
          quoteId,
          productId: extra.productId ?? null,
          kind: extra.kind,
          description: extra.description,
          unit: extra.unit,
          quantity: String(extra.quantity),
          unitPrice: roundMoney(extra.unitPrice),
          subtotal: roundMoney(extra.subtotal),
          notes: extra.notes,
        });
      }
      return { success: true, outcome: "quote" as const, quoteId, totalAmount };
    }

    const requestedByProduct = new Map<number, number>();
    for (const item of calculatedItems) {
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.calculated.quantity);
    }
    for (const extra of calculatedExtras) {
      if (!extra.productId) continue;
      if (!Number.isInteger(extra.quantity)) throw new Error(`O complemento ${extra.description} possui produto associado e deve usar quantidade inteira`);
      requestedByProduct.set(extra.productId, (requestedByProduct.get(extra.productId) || 0) + extra.quantity);
    }
    for (const [productId, quantity] of Array.from(requestedByProduct.entries())) {
      await tx.execute(sql`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`);
      const result = await tx.update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
        .where(and(eq(products.id, productId), gte(products.stockQuantity, quantity)));
      if (affectedRows(result) !== 1) throw new Error(`Estoque insuficiente para o produto #${productId}`);
    }

    const orderResult = await tx.insert(orders).values({
      clientId: input.clientId,
      userId,
      status: "entregue",
      totalAmount: String(totalAmount),
      notes: input.notes ? `[BALCÃO] ${input.notes}` : "[BALCÃO] Venda direta",
      stockAllocatedAt: new Date(),
    });
    const orderId = orderResult[0].insertId;
    for (const item of calculatedItems) {
      await tx.insert(orderItems).values({
        orderId,
        productId: item.productId,
        width: String(item.calculated.width),
        height: String(item.calculated.height),
        quantity: item.calculated.quantity,
        unitPrice: String(item.calculated.unitPrice),
        squareMeters: roundSquareMeters(item.calculated.squareMeters),
        subtotal: roundMoney(item.calculated.subtotal),
        notes: item.notes,
      });
      await tx.insert(stockMovements).values({
        productId: item.productId,
        type: "saida",
        quantity: item.calculated.quantity,
        referenceType: "counter_sale",
        referenceId: orderId,
        notes: `Venda direta de balcão #${orderId}`,
      });
    }
    for (const extra of calculatedExtras) {
      await tx.insert(commercialExtras).values({
        orderId,
        productId: extra.productId ?? null,
        kind: extra.kind,
        description: extra.description,
        unit: extra.unit,
        quantity: String(extra.quantity),
        unitPrice: roundMoney(extra.unitPrice),
        subtotal: roundMoney(extra.subtotal),
        notes: extra.notes,
      });
      if (extra.productId) {
        await tx.insert(stockMovements).values({
          productId: extra.productId,
          type: "saida",
          quantity: extra.quantity,
          referenceType: "counter_sale",
          referenceId: orderId,
          notes: `Complemento ${extra.kind} na venda de balcão #${orderId}`,
        });
      }
    }
    return { success: true, outcome: "sale" as const, orderId, totalAmount };
  });
}

async function requireVisibleCounterOrder(db: any, orderId: number, user: { id: number; role: string } | null | undefined) {
  const criteria = user?.role === "seller"
    ? and(eq(orders.id, orderId), eq(orders.userId, user.id))
    : eq(orders.id, orderId);
  const result = await db.select().from(orders).where(criteria).limit(1);
  if (!result[0]) throw new Error("Venda não encontrada");
  return result[0];
}

/** Finaliza venda presencial ou orçamento a partir do mesmo atendimento de balcão. */
export const counterSalesRouter = router({
  create: protectedProcedure.input(createCounterSaleSchema).mutation(async ({ ctx, input }) => {
    const result = await finalizeCounterTransaction(ctx, { ...input, extras: [], outcome: "sale" });
    const { outcome: _outcome, ...legacyResult } = result;
    return legacyResult;
  }),
  finalize: protectedProcedure.input(finalizeCounterTransactionSchema).mutation(async ({ ctx, input }) => finalizeCounterTransaction(ctx, input)),
  getOrder: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    return requireVisibleCounterOrder(db, input.id, ctx.user);
  }),
});
