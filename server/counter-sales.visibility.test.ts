import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";

const { getDbMock, selectMock, fromMock, whereMock, limitMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  selectMock: vi.fn(),
  fromMock: vi.fn(),
  whereMock: vi.fn(),
  limitMock: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: getDbMock }));

import { appRouter } from "./routers";

function createCaller(role: "seller" | "admin" | "superadmin", id = 7) {
  return appRouter.createCaller({
    user: {
      id,
      openId: `local:${role}:${id}`,
      name: role,
      email: `${role}@empresa.local`,
      role,
      loginMethod: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  });
}

describe("visibilidade de vendas de Balcão", () => {
  beforeEach(() => {
    getDbMock.mockReset();
    selectMock.mockReset();
    fromMock.mockReset();
    whereMock.mockReset();
    limitMock.mockReset();
    selectMock.mockReturnValue({ from: fromMock });
    fromMock.mockReturnValue({ where: whereMock });
    whereMock.mockReturnValue({ limit: limitMock });
    limitMock.mockResolvedValue([{ id: 42, userId: 7, status: "entregue" }]);
    getDbMock.mockResolvedValue({ select: selectMock });
  });

  it("restringe a consulta do Vendedor à venda que lhe pertence", async () => {
    await expect(createCaller("seller", 7).counterSales.getOrder({ id: 42 })).resolves.toMatchObject({ id: 42, userId: 7 });

    const query = new MySqlDialect().sqlToQuery(whereMock.mock.calls[0][0]);
    expect(query.sql).toContain("`orders`.`id`");
    expect(query.sql).toContain("`orders`.`userId`");
    expect(query.params).toEqual([42, 7]);
  });

  it("preserva a consulta administrativa sem filtro de proprietário", async () => {
    await expect(createCaller("admin", 3).counterSales.getOrder({ id: 42 })).resolves.toMatchObject({ id: 42 });

    const query = new MySqlDialect().sqlToQuery(whereMock.mock.calls[0][0]);
    expect(query.sql).toContain("`orders`.`id`");
    expect(query.sql).not.toContain("`orders`.`userId`");
    expect(query.params).toEqual([42]);
  });
});
