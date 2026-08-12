import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { productsRouter } from "./routers/products";
import { suppliersRouter } from "./routers/suppliers";
import { quotesRouter } from "./routers/quotes";
import { ordersRouter } from "./routers/orders";
import { purchaseOrdersRouter } from "./routers/purchaseOrders";
import { stockMovementsRouter } from "./routers/stockMovements";
import { dashboardRouter } from "./routers/dashboard";
import { reportsRouter } from "./routers/reports";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
});

export type AppRouter = typeof appRouter;
