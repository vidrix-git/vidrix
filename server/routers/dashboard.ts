import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderItems, quotes, clients, users, products, purchaseOrders, stockMovements } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export type DashboardPeriod = "7d" | "30d" | "90d" | "month" | "year";

export function resolveDashboardStartDate(period: DashboardPeriod = "30d", now = new Date()): Date {
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

export function summarizeDashboardStats(
  deliveredOrders: Array<{ totalAmount: string | number }>,
  allOrders: Array<{ status: string }>,
  allProducts: Array<{ stockQuantity: number; minStockQuantity: number }>,
  activeQuotes: unknown[],
  recentOrders: unknown[],
) {
  const ordersByStatus: Record<string, number> = {};
  for (const order of allOrders) ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
  const criticalStock = allProducts.filter(product => product.stockQuantity <= product.minStockQuantity && product.stockQuantity > 0);
  const outOfStock = allProducts.filter(product => product.stockQuantity === 0);

  return {
    totalRevenue: deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    ordersByStatus,
    totalOrders: allOrders.length,
    criticalStock: criticalStock.length,
    outOfStock: outOfStock.length,
    activeQuotes: activeQuotes.length,
    recentOrders,
    pendingPurchases: allProducts.filter(product => product.stockQuantity < product.minStockQuantity * 2).length,
  };
}

export const dashboardRouter = router({
  stats: protectedProcedure.input(z.object({ period: z.enum(["7d", "30d", "90d", "month", "year"]).default("30d") }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const startDate = resolveDashboardStartDate(opts.input?.period);

    // Total revenue (delivered orders)
    const deliveredOrders = await db.select().from(orders).where(and(eq(orders.status, "entregue"), gte(orders.createdAt, startDate)));
    const allOrders = await db.select().from(orders).orderBy(orders.createdAt);
    const allProducts = await db.select().from(products);
    const activeQuotes = await db.select().from(quotes).where(eq(quotes.status, "rascunho"));
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
    return summarizeDashboardStats(deliveredOrders as any[], allOrders as any[], allProducts as any[], activeQuotes, recentOrders);
  }),

  revenueByMonth: protectedProcedure.input(z.object({ months: z.number().int().positive().default(6) }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const now = new Date();
    const months = opts.input?.months || 6;
    const data: { month: string; revenue: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthOrders = await db.select().from(orders).where(
        and(eq(orders.status, "entregue"), gte(orders.createdAt, d), lte(orders.createdAt, nextD))
      );
      const revenue = monthOrders.reduce((sum: number, o: any) => sum + parseFloat(String(o.totalAmount)), 0);
      data.push({ month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), revenue });
    }

    return data;
  }),

  commissions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const deliveredOrders = await db.select().from(orders).where(eq(orders.status, "entregue"));
    const userList = await db.select().from(users);

    const commissions: { userId: number; userName: string; totalSales: number; commission: number }[] = [];
    for (const u of userList as any[]) {
      const userOrders = deliveredOrders.filter((o: any) => o.userId === u.id);
      const totalSales = userOrders.reduce((sum: number, o: any) => sum + parseFloat(String(o.totalAmount)), 0);
      commissions.push({
        userId: u.id,
        userName: u.name || u.email || `User #${u.id}`,
        totalSales,
        commission: totalSales * 0.05, // 5% commission
      });
    }

    return commissions.filter(c => c.totalSales > 0);
  }),

  stockAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProducts = await db.select().from(products);
    const movements = await db.select().from(stockMovements);

    return allProducts.map((p: any) => {
      const productMovements = movements.filter((m: any) => m.productId === p.id);
      const totalIn = productMovements.filter((m: any) => m.type === "entrada").reduce((sum: number, m: any) => sum + m.quantity, 0);
      const totalOut = productMovements.filter((m: any) => m.type === "saida").reduce((sum: number, m: any) => sum + m.quantity, 0);
      return {
        ...p,
        totalIn,
        totalOut,
        status: p.stockQuantity === 0 ? "Esgotado" : p.stockQuantity <= p.minStockQuantity ? "Crítico" : "Normal",
      };
    });
  }),
});
