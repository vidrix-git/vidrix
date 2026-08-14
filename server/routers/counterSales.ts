import { z } from "zod";
import { and, eq, gte, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { createCounterSaleSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { orderItems, orders, products, stockMovements } from "../../drizzle/schema";
import { calculateCommercialItem, roundMoney, roundSquareMeters } from "../commercial-rules";

function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result as any;
  return Number((header as any)?.affectedRows || 0);
}

/** Finaliza uma venda presencial como pedido entregue, com baixa de estoque auditável. */
export const counterSalesRouter = router({
  create: protectedProcedure.input(createCounterSaleSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");

    return db.transaction(async (tx) => {
      const calculatedItems = input.items.map((item) => ({ ...item, calculated: calculateCommercialItem(item) }));
      const requestedByProduct = new Map<number, number>();
      for (const item of calculatedItems) {
        requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.calculated.quantity);
      }

      for (const [productId, quantity] of Array.from(requestedByProduct.entries())) {
        await tx.execute(sql`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`);
        const result = await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
          .where(and(eq(products.id, productId), gte(products.stockQuantity, quantity)));
        if (affectedRows(result) !== 1) throw new Error(`Estoque insuficiente para o produto #${productId}`);
      }

      const totalAmount = roundMoney(calculatedItems.reduce((total, item) => total + item.calculated.subtotal, 0));
      const orderResult = await tx.insert(orders).values({
        clientId: input.clientId,
        userId: ctx.user?.id ?? 0,
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
      return { success: true, orderId, totalAmount };
    });
  }),
  getOrder: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    const result = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
    if (!result[0]) throw new Error("Venda não encontrada");
    return result[0];
  }),
});
