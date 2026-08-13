import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { orderItems, orders, products, stockMovements } from "../drizzle/schema";

type Item = Record<string, any>;
type Movement = Record<string, any>;

function createStockFlowDb() {
  const state = {
    order: { id: 900, status: "aprovado", stockAllocatedAt: null, totalAmount: "0.00" } as Record<string, any>,
    product: { id: 35, name: "TESTE - Produto", stockQuantity: 10 },
    items: [] as Item[],
    movements: [] as Movement[],
    nextItemId: 801,
    itemSelectionStep: 0,
  };

  const asyncRows = (rows: Item[] | Record<string, any>[]) => ({
    limit: vi.fn().mockResolvedValue(rows),
    then: <TResult1 = typeof rows, TResult2 = never>(
      onfulfilled?: ((value: typeof rows) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(rows).then(onfulfilled, onrejected),
  });

  const currentOrderItemRows = () => {
    state.itemSelectionStep += 1;
    switch (state.itemSelectionStep) {
      case 2:
      case 4:
        return state.items.filter((item) => item.id === 801);
      case 7:
        return state.items.filter((item) => item.id === 802);
      default:
        return state.items;
    }
  };

  const tx: any = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => asyncRows(
          table === orders ? [state.order] : table === orderItems ? currentOrderItemRows() : [],
        )),
      })),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn().mockImplementation(async (values: Record<string, any>) => {
        if (table === orderItems) {
          const item = { ...values, id: state.nextItemId++ };
          state.items.push(item);
          return [{ insertId: item.id }];
        }
        if (table === stockMovements) {
          state.movements.push({ ...values, id: state.movements.length + 1, createdAt: new Date("2026-08-13T18:00:00.000Z") });
          return [{ insertId: state.movements.length }];
        }
        return [{ insertId: 1 }];
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: Record<string, any>) => ({
        where: vi.fn().mockImplementation(async () => {
          if (table === orders) state.order = { ...state.order, ...values };
          if (table === orderItems) state.items = state.items.map((item) => item.id === 801 ? { ...item, ...values } : item);
          return [{ affectedRows: 1 }];
        }),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(async () => {
        if (table === orderItems) state.items = state.items.filter((item) => item.id !== 802);
      }),
    })),
  };

  const db: any = {
    transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        const rows = table === stockMovements ? state.movements : table === products ? [state.product] : [];
        return {
          orderBy: vi.fn().mockResolvedValue(rows),
          then: <TResult1 = typeof rows, TResult2 = never>(
            onfulfilled?: ((value: typeof rows) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
          ) => Promise.resolve(rows).then(onfulfilled, onrejected),
        };
      }),
    })),
  };

  return { db, state };
}

function createAdminCaller() {
  const ctx = {
    user: {
      id: 9,
      openId: "stock-flow-admin",
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

describe("integração de estoque do pedido", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mantém os tipos de movimento, fecha o saldo líquido e apresenta o mesmo histórico no relatório", async () => {
    const { db, state } = createStockFlowDb();
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = createAdminCaller();

    await caller.orders.addItem({ orderId: 900, productId: 35, width: "100", height: "80", quantity: "2", unitPrice: "100" });
    await caller.orders.updateItem({ id: 801, quantity: "3" });
    await caller.orders.updateItem({ id: 801, quantity: "2" });
    await caller.orders.addItem({ orderId: 900, productId: 35, width: "60", height: "40", quantity: "1", unitPrice: "100" });
    await caller.orders.deleteItem({ id: 802 });
    await caller.orders.updateStatus({ id: 900, status: "cancelado", cancellationReason: "Teste integrado" });

    expect(state.movements.map((movement) => ({
      type: movement.type,
      quantity: movement.quantity,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
    }))).toEqual([
      { type: "saida", quantity: 2, referenceType: "order", referenceId: 900 },
      { type: "saida", quantity: 1, referenceType: "order_adjust", referenceId: 900 },
      { type: "entrada", quantity: 1, referenceType: "order_adjust", referenceId: 900 },
      { type: "saida", quantity: 1, referenceType: "order", referenceId: 900 },
      { type: "entrada", quantity: 1, referenceType: "order_item_remove", referenceId: 900 },
      { type: "entrada", quantity: 2, referenceType: "order_cancel", referenceId: 900 },
    ]);

    const stockDelta = state.movements.reduce((total, movement) => total + (movement.type === "entrada" ? movement.quantity : -movement.quantity), 0);
    expect(stockDelta).toBe(0);
    expect(state.order).toMatchObject({ status: "cancelado", cancelledByUserId: 9, cancellationReason: "Teste integrado" });

    const report = await caller.reports.stockMovementsReport();
    expect(report).toHaveLength(6);
    expect(report).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: "order", reference: "#900", quantity: 2 }),
      expect.objectContaining({ sourceType: "order_adjust", reference: "#900" }),
      expect.objectContaining({ sourceType: "order_item_remove", reference: "#900", type: "entrada" }),
      expect.objectContaining({ sourceType: "order_cancel", reference: "#900", quantity: 2, type: "entrada" }),
    ]));
  });
});
