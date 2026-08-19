import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { hashPassword, localRegister } from "../local-auth";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

const createCashierSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.string().trim().email("Informe um e-mail válido").max(320),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(128),
});

const updateCashierSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.string().trim().email("Informe um e-mail válido").max(320),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(128).optional(),
});

/** Administração de funcionários de frente de caixa. Contas administrativas não são expostas para alteração aqui. */
export const employeesRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(eq(users.role, "cashier"))
      .orderBy(desc(users.createdAt));
  }),

  create: adminProcedure.input(createCashierSchema).mutation(async ({ input }) => {
    const created = await localRegister(input.name, input.email.toLowerCase(), input.password, "cashier");
    if (!created) throw new Error("Não foi possível cadastrar o funcionário. Verifique se o e-mail já está em uso.");
    return { success: true, id: created.user.id };
  }),

  update: adminProcedure.input(updateCashierSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const data: Record<string, unknown> = { name: input.name, email: input.email.toLowerCase() };
    if (input.password) data.password = hashPassword(input.password);
    const result = await db.update(users).set(data).where(and(eq(users.id, input.id), eq(users.role, "cashier")));
    if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("Funcionário não encontrado");
    return { success: true };
  }),

  delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (ctx.user.id === input.id) throw new Error("Não é possível excluir a própria conta");
    await db.delete(users).where(and(eq(users.id, input.id), eq(users.role, "cashier"), ne(users.id, ctx.user.id)));
    return { success: true };
  }),
});
