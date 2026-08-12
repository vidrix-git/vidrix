import { protectedProcedure, router } from "../_core/trpc";
import { createSupplierSchema, updateSupplierSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { suppliers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const suppliersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(suppliers).orderBy(suppliers.name);
  }),

  get: protectedProcedure.input(updateSupplierSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(suppliers).where(eq(suppliers.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Fornecedor não encontrado");
    return result[0];
  }),

  create: protectedProcedure.input(createSupplierSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(suppliers).values(opts.input);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateSupplierSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(suppliers).set(data).where(eq(suppliers.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(updateSupplierSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(suppliers).where(eq(suppliers.id, opts.input.id));
    return { success: true };
  }),
});
