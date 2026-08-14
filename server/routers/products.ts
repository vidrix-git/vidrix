import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { createProductSchema, updateProductSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(products).orderBy(products.name);
  }),

  get: protectedProcedure.input(updateProductSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(products).where(eq(products.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Produto não encontrado");
    return result[0];
  }),

  create: adminProcedure.input(createProductSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, unitPrice, stockQuantity, minStockQuantity, ...rest } = opts.input;
    const result = await db.insert(products).values({
      ...rest,
      width,
      height,
      unitPrice,
      stockQuantity: Number(stockQuantity),
      minStockQuantity: Number(minStockQuantity),
    });
    return { success: true, insertId: result[0].insertId };
  }),

  update: adminProcedure.input(updateProductSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, unitPrice, stockQuantity, minStockQuantity, ...rest } = opts.input;
    const data: Record<string, unknown> = { ...rest };
    if (width !== undefined) data.width = width;
    if (height !== undefined) data.height = height;
    if (unitPrice !== undefined) data.unitPrice = unitPrice;
    if (stockQuantity !== undefined) data.stockQuantity = Number(stockQuantity);
    if (minStockQuantity !== undefined) data.minStockQuantity = Number(minStockQuantity);
    await db.update(products).set(data).where(eq(products.id, id));
    return { success: true };
  }),

  delete: adminProcedure.input(updateProductSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(products).where(eq(products.id, opts.input.id));
    return { success: true };
  }),
});
