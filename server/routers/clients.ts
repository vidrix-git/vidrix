import { protectedProcedure, router } from "../_core/trpc";
import { createClientSchema, updateClientSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const clientsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(clients).orderBy(clients.createdAt);
  }),

  get: protectedProcedure.input(updateClientSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(clients).where(eq(clients.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Cliente não encontrado");
    return result[0];
  }),

  create: protectedProcedure.input(createClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(clients).values(opts.input);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(clients).set(data).where(eq(clients.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(updateClientSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(clients).where(eq(clients.id, opts.input.id));
    return { success: true };
  }),
});
