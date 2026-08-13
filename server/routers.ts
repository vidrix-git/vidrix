import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { localLogin, localRegister } from "./local-auth";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { clientsRouter } from "./routers/clients";
import { productsRouter } from "./routers/products";
import { suppliersRouter } from "./routers/suppliers";
import { quotesRouter } from "./routers/quotes";
import { ordersRouter } from "./routers/orders";
import { purchaseOrdersRouter } from "./routers/purchaseOrders";
import { stockMovementsRouter } from "./routers/stockMovements";
import { dashboardRouter } from "./routers/dashboard";
import { reportsRouter } from "./routers/reports";
import { legacyMigrationRouter } from "./routers/legacyMigration";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Local login with username/email + password
    login: publicProcedure
      .input(
        z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await localLogin(input.username, input.password);
        if (!result) {
          throw new Error("Invalid credentials");
        }

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return {
          success: true,
          token: result.token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          },
        };
      }),

    // Register new user (public - first user becomes admin, rest become users)
    register: publicProcedure
      .input(
        z.object({
          username: z.string().min(1),
          password: z.string().min(6),
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          role: z.enum(["admin", "user"]).default("user"),
        })
      )
      .mutation(async ({ input }) => {
        // If no users exist yet, first user is always admin
        const db = await getDb();
        let finalRole = input.role;
        if (db) {
          const existing = await db.select().from(users).limit(1);
          if (existing.length === 0) {
            finalRole = "admin";
          }
        }
        const result = await localRegister(
          input.username,
          input.email || `${input.username}@vidrix.local`,
          input.password,
          finalRole
        );
        if (!result) {
          throw new Error("Registration failed. User may already exist.");
        }
        return {
          success: true,
          token: result.token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          },
        };
      }),
  }),
  clients: clientsRouter,
  products: productsRouter,
  suppliers: suppliersRouter,
  quotes: quotesRouter,
  orders: ordersRouter,
  purchaseOrders: purchaseOrdersRouter,
  stockMovements: stockMovementsRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  legacyMigration: legacyMigrationRouter,
});

export type AppRouter = typeof appRouter;
