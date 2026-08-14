import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

function createAdminCaller() {
  return appRouter.createCaller({
    user: { id: 9, openId: "dashboard-admin", email: "admin@vidrix.local", name: "Administrador", loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext);
}

function createSequencedDb(rowsBySelect: Array<Array<Record<string, unknown>>>) {
  const select = vi.fn(() => {
    const rows = rowsBySelect.shift() || [];
    const result = {
      where: vi.fn().mockResolvedValue(rows),
      orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows), then: (resolve: (value: typeof rows) => unknown) => Promise.resolve(rows).then(resolve) })),
      then: (resolve: (value: typeof rows) => unknown) => Promise.resolve(rows).then(resolve),
    };
    return { from: vi.fn(() => result) };
  });
  return { select };
}

describe("contrato das procedures do dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna os indicadores de stats estruturados para o período solicitado", async () => {
    const db = createSequencedDb([
      [{ totalAmount: "150.00" }],
      [{ status: "entregue" }, { status: "rascunho" }],
      [{ stockQuantity: 0, minStockQuantity: 2 }, { stockQuantity: 2, minStockQuantity: 2 }],
      [{ id: 4 }],
      [{ id: 20, status: "entregue" }],
    ]);
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(createAdminCaller().dashboard.stats({ period: "7d" })).resolves.toMatchObject({
      totalRevenue: 150,
      totalOrders: 2,
      ordersByStatus: { entregue: 1, rascunho: 1 },
      criticalStock: 1,
      outOfStock: 1,
      activeQuotes: 1,
      pendingPurchases: 2,
      recentOrders: [{ id: 20, status: "entregue" }],
    });
  });

  it("retorna uma série mensal com o número solicitado de períodos", async () => {
    const db = createSequencedDb([
      [{ totalAmount: "100.00" }],
      [{ totalAmount: "50.50" }],
    ]);
    vi.mocked(getDb).mockResolvedValue(db as never);

    const data = await createAdminCaller().dashboard.revenueByMonth({ months: 2 });
    expect(data).toHaveLength(2);
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({ revenue: 100 }),
      expect.objectContaining({ revenue: 50.5 }),
    ]));
  });

  it("rejeita quantidade de meses inválida antes de consultar indicadores", async () => {
    vi.mocked(getDb).mockResolvedValue(createSequencedDb([]) as never);
    await expect(createAdminCaller().dashboard.revenueByMonth({ months: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(getDb).not.toHaveBeenCalled();
  });
});
