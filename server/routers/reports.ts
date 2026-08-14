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

export function summarizeRevenue(delivered: Array<{ totalAmount: string | number }>, items: Array<{ quantity: string | number }>) {
  const totalRevenue = delivered.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = delivered.length;
  const totalItems = items.reduce((sum, item) => sum + Number.parseInt(String(item.quantity), 10), 0);
  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders,
    totalItems,
    averageTicket: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00",
  };
}

export function summarizeCommissions(
  deliveredOrders: Array<{ userId: number; totalAmount: string | number }>,
  userList: Array<{ id: number; name?: string | null; email?: string | null }>,
) {
  const byUser: Record<string, { totalSales: number; orderCount: number }> = {};
  for (const order of deliveredOrders) {
    const key = String(order.userId);
    if (!byUser[key]) byUser[key] = { totalSales: 0, orderCount: 0 };
    byUser[key].totalSales += Number(order.totalAmount);
    byUser[key].orderCount++;
  }
  return Object.entries(byUser).map(([userId, data]) => {
    const user = userList.find(candidate => candidate.id === Number.parseInt(userId, 10));
    return {
      userName: user?.name || user?.email || `User #${userId}`,
      deliveredOrders: data.orderCount,
      totalSales: Number(data.totalSales.toFixed(2)),
      commission: Number((data.totalSales * 0.05).toFixed(2)),
    };
  });
}

export function summarizeStockAnalysis(productsList: Array<{ name: string; type?: string | null; stockQuantity?: number | null; minStockQuantity?: number | null; unitPrice: string | number }>) {
  return productsList.map(product => {
    const stock = product.stockQuantity || 0;
    const min = product.minStockQuantity || 10;
    const status = stock === 0 ? "esgotado" : stock <= min ? "critico" : stock <= min * 2 ? "baixo" : "normal";
    const recommendedAction = status === "esgotado" ? "Reposição urgente" : status === "critico" ? "Solicitar compra" : status === "baixo" ? "Monitorar" : "Nenhuma";
    return {
      productName: product.name,
      type: product.type || "N/A",
      currentStock: stock,
      minStock: min,
      status,
      recommendedAction,
      stockValue: (stock * Number(product.unitPrice)).toFixed(2),
    };
  });
}

export function buildQuotesReport(
  allQuotes: Array<{ id: number; clientId: number; status: string; totalAmount: string | number; createdAt: Date }>,
  clientList: Array<{ id: number; name: string }>,
) {
  return allQuotes.map(quote => ({
    quoteId: quote.id,
    clientName: clientList.find(client => client.id === quote.clientId)?.name || `Cliente #${quote.clientId}`,
    status: quote.status,
    totalAmount: String(quote.totalAmount),
    createdAt: quote.createdAt.toISOString().split("T")[0],
  }));
}

export function buildStockMovementsReport(movements: any[], productList: Array<{ id: number; name: string }>) {
  return movements.map(movement => toStockMovementReportRow(
    movement,
    productList.find(product => product.id === movement.productId)?.name || `Produto #${movement.productId}`,
  ));
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
    const itemCounts = await db.select().from(orderItems);
    return summarizeRevenue(delivered as any[], itemCounts as any[]);
  }),

  commissions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const deliveredOrders = await db.select().from(orders).where(eq(orders.status, "entregue"));
    const userList = await db.select().from(users);

    return summarizeCommissions(deliveredOrders as any[], userList as any[]);
  }),

  stockAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProducts = await db.select().from(products);

    return summarizeStockAnalysis(allProducts as any[]);
  }),

  quotesReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
    const clientList = await db.select().from(clients);

    return buildQuotesReport(allQuotes as any[], clientList as any[]);
  }),

  stockMovementsReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const movements = await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    const productList = await db.select().from(products);

    return buildStockMovementsReport(movements as any[], productList as any[]);
  }),
});
