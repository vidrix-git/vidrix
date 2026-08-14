import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, quotes, users, products, stockMovements, clients, orderItems } from "../../drizzle/schema";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import { toStockMovementReportRow } from "../stock-history";

export type RevenuePeriodInput = { startDate?: string; endDate?: string } | undefined;

export function resolveRevenuePeriod(input: RevenuePeriodInput) {
  if (!input?.startDate && !input?.endDate) return null;
  if (!input?.startDate || !input?.endDate) throw new Error("Período de faturamento inválido");

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error("Período de faturamento inválido");
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export const reportsRouter = router({
  revenue: protectedProcedure
    .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional())
    .query(async (opts) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const period = resolveRevenuePeriod(opts.input);
      if (period) {
        return db.select().from(orders)
          .where(and(eq(orders.status, "entregue"), gte(orders.createdAt, period.start), lte(orders.createdAt, period.end)))
          .orderBy(desc(orders.createdAt));
      }
      return db.select().from(orders).where(eq(orders.status, "entregue")).orderBy(desc(orders.createdAt));
    }),

  revenueSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const delivered = await db.select().from(orders).where(eq(orders.status, "entregue"));
    const totalRevenue = delivered.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
    const totalOrders = delivered.length;

    const itemCounts = await db.select().from(orderItems);
    const totalItems = itemCounts.reduce((sum, item) => sum + parseInt(String(item.quantity)), 0);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalItems,
      averageTicket: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00",
    };
  }),

  commissions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const deliveredOrders = await db.select().from(orders).where(eq(orders.status, "entregue"));
    const userList = await db.select().from(users);

    // Aggregate by user
    const byUser: Record<string, { totalSales: number; orderCount: number }> = {};
    for (const o of deliveredOrders as any[]) {
      const key = String(o.userId);
      if (!byUser[key]) {
        byUser[key] = { totalSales: 0, orderCount: 0 };
      }
      byUser[key].totalSales += parseFloat(String(o.totalAmount));
      byUser[key].orderCount++;
    }

    return Object.entries(byUser).map(([userId, data]) => {
      const user = userList.find((u: any) => u.id === parseInt(userId));
      return {
        userName: user?.name || user?.email || `User #${userId}`,
        deliveredOrders: data.orderCount,
        totalSales: parseFloat(data.totalSales.toFixed(2)),
        commission: parseFloat((data.totalSales * 0.05).toFixed(2)),
      };
    });
  }),

  stockAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProducts = await db.select().from(products);

    return allProducts.map((p: any) => {
      const stock = p.stockQuantity || 0;
      const min = p.minStockQuantity || 10;
      const status = stock === 0 ? "esgotado" : stock <= min ? "critico" : stock <= min * 2 ? "baixo" : "normal";
      let action = "Nenhuma";
      if (status === "esgotado") action = "Reposição urgente";
      if (status === "critico") action = "Solicitar compra";
      if (status === "baixo") action = "Monitorar";

      return {
        productName: p.name,
        type: p.type || "N/A",
        currentStock: stock,
        minStock: min,
        status,
        recommendedAction: action,
        stockValue: (stock * parseFloat(String(p.unitPrice))).toFixed(2),
      };
    });
  }),

  quotesReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
    const clientList = await db.select().from(clients);

    return allQuotes.map((q: any) => ({
      quoteId: q.id,
      clientName: clientList.find((c: any) => c.id === q.clientId)?.name || `Cliente #${q.clientId}`,
      status: q.status,
      totalAmount: String(q.totalAmount),
      createdAt: q.createdAt.toISOString().split("T")[0],
    }));
  }),

  stockMovementsReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const movements = await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    const productList = await db.select().from(products);

    return movements.map((m: any) => toStockMovementReportRow(
      m,
      productList.find((p: any) => p.id === m.productId)?.name || `Produto #${m.productId}`,
    ));
  }),
});
