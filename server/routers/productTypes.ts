import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { productTypes, products } from "../../drizzle/schema";
import { createProductTypeSchema, updateProductTypeSchema } from "../../shared/schemas";
import { asc, eq, sql } from "drizzle-orm";

export const productTypesRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(productTypes).orderBy(asc(productTypes.name));
  }),

  create: adminProcedure.input(createProductTypeSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(productTypes).values({ name: input.name });
    return { success: true, insertId: Number(result[0].insertId) };
  }),

  update: adminProcedure.input(updateProductTypeSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(productTypes).set({ name: input.name }).where(eq(productTypes.id, input.id));
    return { success: true };
  }),

  delete: adminProcedure.input(updateProductTypeSchema.pick({ id: true })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [type] = await db.select().from(productTypes).where(eq(productTypes.id, input.id)).limit(1);
    if (!type) throw new Error("Tipo de produto não encontrado");
    const [usage] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.type, type.name));
    if (Number(usage?.count || 0) > 0) throw new Error("Este tipo está vinculado a produtos e não pode ser removido");
    await db.delete(productTypes).where(eq(productTypes.id, input.id));
    return { success: true };
  }),
});
