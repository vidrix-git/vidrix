import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { buildQuotesReport, buildStockMovementsReport, resolveRevenuePeriod, summarizeCommissions, summarizeRevenue, summarizeStockAnalysis } from "./routers/reports";

function createAdminCaller() {
  return appRouter.createCaller({
    user: { id: 9, openId: "report-admin", email: "admin@vidrix.local", name: "Administrador", loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext);
}

function createReportsDb(rows: Array<Record<string, unknown>>) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  return { db: { select: vi.fn(() => ({ from })) }, from, where, orderBy };
}

function createSequencedReportsDb(rowsBySelect: Array<Array<Record<string, unknown>>>) {
  const select = vi.fn(() => {
    const rows = rowsBySelect.shift() || [];
    const result = {
      where: vi.fn().mockResolvedValue(rows),
      orderBy: vi.fn().mockResolvedValue(rows),
      then: (resolve: (value: typeof rows) => unknown) => Promise.resolve(rows).then(resolve),
    };
    return { from: vi.fn(() => result) };
  });
  return { select };
}

describe("contrato de faturamento por período", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normaliza um intervalo válido e fecha o dia final", () => {
    const period = resolveRevenuePeriod({ startDate: "2026-08-01", endDate: "2026-08-14" });

    expect(period?.start.toISOString()).toContain("2026-08-01");
    expect(period?.end.getHours()).toBe(23);
    expect(period?.end.getMinutes()).toBe(59);
    expect(period?.end.getSeconds()).toBe(59);
  });

  it.each([
    [{ startDate: "invalida", endDate: "2026-08-14" }],
    [{ startDate: "2026-08-15", endDate: "2026-08-14" }],
    [{ startDate: "2026-08-14" }],
  ])("rejeita período inválido ou incompleto: %o", (input) => {
    expect(() => resolveRevenuePeriod(input)).toThrow("Período de faturamento inválido");
  });

  it("consulta somente a receita entregue quando recebe um período válido", async () => {
    const rows = [{ id: 901, status: "entregue", totalAmount: "101.00", createdAt: new Date("2026-08-12T10:00:00Z") }];
    const { db, where, orderBy } = createReportsDb(rows);
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(createAdminCaller().reports.revenue({ startDate: "2026-08-01", endDate: "2026-08-14" })).resolves.toEqual(rows);
    expect(where).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it("resume receita e ticket sem perder quantidade de itens", () => {
    expect(summarizeRevenue([{ totalAmount: "100.00" }, { totalAmount: 50 }], [{ quantity: 2 }, { quantity: "3" }]))
      .toEqual({ totalRevenue: "150.00", totalOrders: 2, totalItems: 5, averageTicket: "75.00" });
  });

  it("calcula comissões por vendedor e usa nome de fallback", () => {
    expect(summarizeCommissions(
      [{ userId: 1, totalAmount: "100.00" }, { userId: 1, totalAmount: 50 }, { userId: 2, totalAmount: 20 }],
      [{ id: 1, name: "Ana" }],
    )).toEqual([
      { userName: "Ana", deliveredOrders: 2, totalSales: 150, commission: 7.5 },
      { userName: "User #2", deliveredOrders: 1, totalSales: 20, commission: 1 },
    ]);
  });

  it("classifica saldo, ação recomendada e valor do estoque", () => {
    expect(summarizeStockAnalysis([
      { name: "Sem saldo", stockQuantity: 0, minStockQuantity: 2, unitPrice: "10.00" },
      { name: "Crítico", stockQuantity: 2, minStockQuantity: 2, unitPrice: "11.00" },
      { name: "Baixo", stockQuantity: 3, minStockQuantity: 2, unitPrice: "12.00" },
      { name: "Normal", stockQuantity: 8, minStockQuantity: 2, unitPrice: "13.00" },
    ])).toMatchObject([
      { status: "esgotado", recommendedAction: "Reposição urgente", stockValue: "0.00" },
      { status: "critico", recommendedAction: "Solicitar compra", stockValue: "22.00" },
      { status: "baixo", recommendedAction: "Monitorar", stockValue: "36.00" },
      { status: "normal", recommendedAction: "Nenhuma", stockValue: "104.00" },
    ]);
  });

  it("formata relatórios de orçamento e movimentos com identificação legível", () => {
    expect(buildQuotesReport(
      [{ id: 7, clientId: 3, status: "rascunho", totalAmount: "101.00", createdAt: new Date("2026-08-14T12:00:00Z") }],
      [{ id: 3, name: "Cliente de Teste" }],
    )).toEqual([{ quoteId: 7, clientName: "Cliente de Teste", status: "rascunho", totalAmount: "101.00", createdAt: "2026-08-14" }]);

    expect(buildStockMovementsReport(
      [{ id: 8, productId: 99, type: "entrada", quantity: 1, referenceType: "purchase_order", referenceId: 12, notes: null, createdAt: new Date("2026-08-14T12:00:00Z") }],
      [],
    )[0]).toMatchObject({ productName: "Produto #99", type: "entrada", sourceType: "purchase_order", reference: "#12" });
  });

  it("expõe a procedure de comissões agrupada por vendedor", async () => {
    vi.mocked(getDb).mockResolvedValue(createSequencedReportsDb([
      [{ userId: 1, totalAmount: "120.00" }],
      [{ id: 1, name: "Ana" }],
    ]) as never);

    await expect(createAdminCaller().reports.commissions()).resolves.toEqual([
      { userName: "Ana", deliveredOrders: 1, totalSales: 120, commission: 6 },
    ]);
  });

  it("expõe a procedure de análise de estoque com status e ação", async () => {
    vi.mocked(getDb).mockResolvedValue(createSequencedReportsDb([
      [{ name: "Vidro", stockQuantity: 0, minStockQuantity: 2, unitPrice: "20.00" }],
    ]) as never);

    await expect(createAdminCaller().reports.stockAnalysis()).resolves.toEqual([
      expect.objectContaining({ productName: "Vidro", status: "esgotado", recommendedAction: "Reposição urgente" }),
    ]);
  });

  it("expõe procedures de orçamento e movimentos com dados relacionados", async () => {
    vi.mocked(getDb).mockResolvedValue(createSequencedReportsDb([
      [{ id: 7, clientId: 3, status: "rascunho", totalAmount: "101.00", createdAt: new Date("2026-08-14T12:00:00Z") }],
      [{ id: 3, name: "Cliente de Teste" }],
    ]) as never);
    await expect(createAdminCaller().reports.quotesReport()).resolves.toEqual([
      { quoteId: 7, clientName: "Cliente de Teste", status: "rascunho", totalAmount: "101.00", createdAt: "2026-08-14" },
    ]);

    vi.mocked(getDb).mockResolvedValue(createSequencedReportsDb([
      [{ id: 8, productId: 99, type: "entrada", quantity: 1, referenceType: "purchase_order", referenceId: 12, notes: null, createdAt: new Date("2026-08-14T12:00:00Z") }],
      [],
    ]) as never);
    await expect(createAdminCaller().reports.stockMovementsReport()).resolves.toEqual([
      expect.objectContaining({ productName: "Produto #99", type: "entrada", reference: "#12" }),
    ]);
  });
});
