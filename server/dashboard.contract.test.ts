import { describe, expect, it } from "vitest";
import { resolveDashboardStartDate, summarizeDashboardStats } from "./routers/dashboard";

describe("contrato dos indicadores do dashboard", () => {
  it("calcula o início correto para os períodos comerciais", () => {
    const now = new Date("2026-08-14T12:00:00Z");

    expect(resolveDashboardStartDate("7d", now).toISOString()).toContain("2026-08-07");
    expect(resolveDashboardStartDate("30d", now).toISOString()).toContain("2026-07-15");
    expect(resolveDashboardStartDate("90d", now).toISOString()).toContain("2026-05-16");
    expect(resolveDashboardStartDate("month", now).toISOString()).toContain("2026-08-01");
    expect(resolveDashboardStartDate("year", now).toISOString()).toContain("2026-01-01");
  });

  it("resume receita entregue, status e alertas de saldo com critérios consistentes", () => {
    const summary = summarizeDashboardStats(
      [{ totalAmount: "101.00" }, { totalAmount: 49.5 }],
      [{ status: "entregue" }, { status: "entregue" }, { status: "cancelado" }],
      [
        { stockQuantity: 0, minStockQuantity: 2 },
        { stockQuantity: 2, minStockQuantity: 2 },
        { stockQuantity: 7, minStockQuantity: 2 },
      ],
      [{ id: 1 }],
      [{ id: 10 }],
    );

    expect(summary).toMatchObject({
      totalRevenue: 150.5,
      ordersByStatus: { entregue: 2, cancelado: 1 },
      totalOrders: 3,
      criticalStock: 1,
      outOfStock: 1,
      activeQuotes: 1,
      pendingPurchases: 2,
      recentOrders: [{ id: 10 }],
    });
  });
});
