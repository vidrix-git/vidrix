import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderItems, quotes, clients, users, products, purchaseOrders, stockMovements } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export const dashboardRouter = router({
  stats: protectedProcedure.input(z.object({ period: z.enum(["7d", "30d", "90d", "month", "year"]).default("30d") }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    if (opts.input?.period === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (opts.input?.period === "90d") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (opts.input?.period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (opts.input?.period === "year") startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total revenue (delivered orders)
    const deliveredOrders = await db.select().from(orders).where(and(eq(orders.status, "entregue"), gte(orders.createdAt, startDate)));
    const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + parseFloat(String(o.totalAmount)), 0);

    // Orders by status
    const allOrders = await db.select().from(orders).orderBy(orders.createdAt);
    const ordersByStatus: Record<string, number> = {};
    for (const o of allOrders as any[]) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    }

    // Critical stock (products below min)
    const allProducts = await db.select().from(products);
    const criticalStock = allProducts.filter((p: any) => p.stockQuantity <= p.minStockQuantity && p.stockQuantity > 0);
    const outOfStock = allProducts.filter((p: any) => p.stockQuantity === 0);

    // Active quotes
    const activeQuotes = await db.select().from(quotes).where(eq(quotes.status, "rascunho"));

    // Recent orders
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);

    return {
      totalRevenue,
      ordersByStatus,
      totalOrders: allOrders.length,
      criticalStock: criticalStock.length,
      outOfStock: outOfStock.length,
      activeQuotes: activeQuotes.length,
      recentOrders,
      pendingPurchases: allProducts.filter((p: any) => p.stockQuantity < p.minStockQuantity * 2).length,
    };
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
