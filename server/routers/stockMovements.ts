import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { stockMovements, products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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

  manualEntry: protectedProcedure.input(z.object({ productId: z.number().int().positive(), type: z.enum(["entrada", "saida"]), quantity: z.number().int().positive(), notes: z.string().optional().nullable() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const product = await db.select().from(products).where(eq(products.id, opts.input.productId)).limit(1);
    if (product.length === 0) throw new Error("Produto não encontrado");
    const currentProduct = product[0] as any;

    if (opts.input.type === "entrada") {
      const newStock = currentProduct.stockQuantity + opts.input.quantity;
      await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, opts.input.productId));
    } else {
      if (opts.input.quantity > currentProduct.stockQuantity) {
        throw new Error("Quantidade em estoque insuficiente");
      }
      const newStock = currentProduct.stockQuantity - opts.input.quantity;
      await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, opts.input.productId));
    }

    await db.insert(stockMovements).values({
      productId: opts.input.productId,
      type: opts.input.type,
      quantity: opts.input.quantity,
      referenceType: "manual",
      notes: opts.input.notes || null,
    });
    return { success: true };
  }),
});
