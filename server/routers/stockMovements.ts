import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { stockMovements, products } from "../../drizzle/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export const stockMovementsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(stockMovements).orderBy(stockMovements.createdAt);
  }),

  listByProduct: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(stockMovements).where(eq(stockMovements.productId, opts.input.productId));
  }),

  manualEntry: adminProcedure.input(z.object({ productId: z.number().int().positive(), type: z.enum(["entrada", "saida"]), quantity: z.number().int().positive(), notes: z.string().optional().nullable() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.transaction(async (tx) => {
      const product = await tx.select().from(products).where(eq(products.id, opts.input.productId)).limit(1);
      if (product.length === 0) throw new Error("Produto não encontrado");

      const result = opts.input.type === "entrada"
        ? await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${opts.input.quantity}` }).where(eq(products.id, opts.input.productId))
        : await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${opts.input.quantity}` }).where(and(eq(products.id, opts.input.productId), gte(products.stockQuantity, opts.input.quantity)));
      const affectedRows = Number((Array.isArray(result) ? result[0] : result as any)?.affectedRows || 0);
      if (affectedRows !== 1) throw new Error("Quantidade em estoque insuficiente");

      await tx.insert(stockMovements).values({
        productId: opts.input.productId,
        type: opts.input.type,
        quantity: opts.input.quantity,
        referenceType: "manual",
        notes: opts.input.notes || null,
      });
    });
    return { success: true };
  }),
});
