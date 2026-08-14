import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { resolveRevenuePeriod } from "./routers/reports";

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
});
