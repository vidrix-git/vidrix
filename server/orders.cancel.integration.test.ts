import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { orderItems, orders, products, stockMovements } from "../drizzle/schema";

type CancelTestState = {
  order: Record<string, unknown>;
  item: Record<string, unknown>;
  orderUpdates: Array<Record<string, unknown>>;
  productUpdates: Array<Record<string, unknown>>;
  movements: Array<Record<string, unknown>>;
};

function createOrderCancellationDb() {
  const state: CancelTestState = {
    order: {
      id: 501,
      status: "aprovado",
      stockAllocatedAt: new Date("2026-08-13T18:00:00.000Z"),
      cancelledAt: null,
      cancelledByUserId: null,
      cancellationReason: null,
    },
    item: { id: 701, orderId: 501, productId: 35, quantity: 2 },
    orderUpdates: [],
    productUpdates: [],
    movements: [],
  };

  const recordQuery = (records: Array<Record<string, unknown>>) => ({
    limit: vi.fn().mockResolvedValue(records),
    then: <TResult1 = Array<Record<string, unknown>>, TResult2 = never>(
      onfulfilled?: ((value: Array<Record<string, unknown>>) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(records).then(onfulfilled, onrejected),
  });

  const tx: any = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => recordQuery(
          table === orders ? [state.order] : table === orderItems ? [state.item] : [],
        )),
      })),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: Record<string, unknown>) => ({
        where: vi.fn().mockImplementation(async () => {
          if (table === orders) {
            state.order = { ...state.order, ...values };
            state.orderUpdates.push(values);
          }
          if (table === products) state.productUpdates.push(values);
          return [{ affectedRows: 1 }];
        }),
      })),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn().mockImplementation(async (values: Record<string, unknown>) => {
        if (table === stockMovements) state.movements.push(values);
        return [{ insertId: state.movements.length }];
      }),
    })),
  };

  return {
    state,
    db: { transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)) },
  };
}

function createAdminCaller() {
  const ctx = {
    user: {
      id: 9,
      openId: "orders-cancellation-admin",
      email: "admin@vidrix.local",
      name: "Administrador de integração",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;

  return appRouter.createCaller(ctx);
}

describe("orders.updateStatus — cancelamento auditável", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persiste a auditoria, cria um único estorno e ignora o segundo cancelamento", async () => {
    const { db, state } = createOrderCancellationDb();
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = createAdminCaller();

    const firstResult = await caller.orders.updateStatus({
      id: 501,
      status: "cancelado",
      cancellationReason: "Teste de auditoria",
    });

    expect(firstResult).toEqual({ success: true, cancelled: true });
    expect(state.order).toMatchObject({
      status: "cancelado",
      cancelledByUserId: 9,
      cancellationReason: "Teste de auditoria",
    });
    expect(state.order.cancelledAt).toBeInstanceOf(Date);
    expect(state.productUpdates).toHaveLength(1);
    expect(state.movements).toEqual([
      expect.objectContaining({
        productId: 35,
        type: "entrada",
        quantity: 2,
        referenceType: "order_cancel",
        referenceId: 501,
      }),
    ]);

    const productUpdateCount = state.productUpdates.length;
    const movementCount = state.movements.length;
    const secondResult = await caller.orders.updateStatus({ id: 501, status: "cancelado" });

    expect(secondResult).toEqual({ success: true, unchanged: true });
    expect(state.productUpdates).toHaveLength(productUpdateCount);
    expect(state.movements).toHaveLength(movementCount);
  });
});
