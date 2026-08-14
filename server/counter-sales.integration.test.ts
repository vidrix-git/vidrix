import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { orderItems, orders, products, stockMovements } from "../drizzle/schema";

type CounterSaleState = {
  product: { id: number; stockQuantity: number };
  order: Record<string, unknown> | null;
  items: Array<Record<string, unknown>>;
  movements: Array<Record<string, unknown>>;
};

function createCounterSaleDb(initialStock: number, requestedQuantity: number) {
  const state: CounterSaleState = {
    product: { id: 35, stockQuantity: initialStock },
    order: null,
    items: [],
    movements: [],
  };

  const tx: any = {
    execute: vi.fn().mockResolvedValue(undefined),
    update: vi.fn((table: unknown) => ({
      set: vi.fn(() => ({
        where: vi.fn().mockImplementation(async () => {
          if (table !== products || state.product.stockQuantity < requestedQuantity) return [{ affectedRows: 0 }];
          state.product.stockQuantity -= requestedQuantity;
          return [{ affectedRows: 1 }];
        }),
      })),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn().mockImplementation(async (values: Record<string, unknown>) => {
        if (table === orders) {
          state.order = { ...values, id: 901 };
          return [{ insertId: 901 }];
        }
        if (table === orderItems) {
          state.items.push({ ...values, id: state.items.length + 1 });
          return [{ insertId: state.items.length }];
        }
        if (table === stockMovements) {
          state.movements.push({ ...values, id: state.movements.length + 1 });
          return [{ insertId: state.movements.length }];
        }
        return [{ insertId: 1 }];
      }),
    })),
  };

  return { state, tx, db: { transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)) } };
}

function createAdminCaller() {
  const ctx = {
    user: {
      id: 9,
      openId: "counter-sale-admin",
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

describe("integração da Venda Direta", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria pedido entregue, registra item, baixa o estoque e grava o movimento auditável", async () => {
    const { db, state, tx } = createCounterSaleDb(10, 2);
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(createAdminCaller().counterSales.create({
      clientId: 40,
      notes: "Pagamento no balcão",
      items: [{ productId: 35, width: "100", height: "80", quantity: "2", unitPrice: "100", notes: null }],
    })).resolves.toEqual({ success: true, orderId: 901, totalAmount: "160.00" });

    expect(tx.execute).toHaveBeenCalledTimes(1);
    expect(state.product.stockQuantity).toBe(8);
    expect(state.order).toMatchObject({ id: 901, clientId: 40, userId: 9, status: "entregue", totalAmount: "160.00", notes: "[BALCÃO] Pagamento no balcão" });
    expect(state.items).toEqual([expect.objectContaining({ orderId: 901, productId: 35, quantity: 2, squareMeters: "0.8000", subtotal: "160.00" })]);
    expect(state.movements).toEqual([expect.objectContaining({ productId: 35, type: "saida", quantity: 2, referenceType: "counter_sale", referenceId: 901 })]);
  });

  it("interrompe a venda sem criar pedido quando não há estoque suficiente", async () => {
    const { db, state } = createCounterSaleDb(1, 2);
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(createAdminCaller().counterSales.create({
      clientId: 40,
      items: [{ productId: 35, width: "100", height: "80", quantity: "2", unitPrice: "100", notes: null }],
    })).rejects.toThrow("Estoque insuficiente para o produto #35");

    expect(state.product.stockQuantity).toBe(1);
    expect(state.order).toBeNull();
    expect(state.items).toEqual([]);
    expect(state.movements).toEqual([]);
  });
});
