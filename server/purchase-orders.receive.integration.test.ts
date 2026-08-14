import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { products, purchaseOrderItems, purchaseOrders, stockMovements } from "../drizzle/schema";

function createPurchaseReceiveDb() {
  const state = {
    purchaseOrder: { id: 801, status: "pendente" },
    product: { id: 35, stockQuantity: 4 },
    items: [{ id: 1, purchaseOrderId: 801, productId: 35, quantity: 3 }],
    movements: [] as Array<Record<string, unknown>>,
  };

  const tx: any = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockImplementation(async () => table === purchaseOrders ? [state.purchaseOrder] : []),
          then: undefined,
        })),
      })),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: Record<string, unknown>) => ({
        where: vi.fn().mockImplementation(async () => {
          if (table === products) {
            state.product.stockQuantity += 3;
            return [{ affectedRows: 1 }];
          }
          if (table === purchaseOrders) {
            state.purchaseOrder.status = String(values.status);
            return [{ affectedRows: 1 }];
          }
          return [{ affectedRows: 0 }];
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

  const db: any = {
    transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => table === purchaseOrderItems ? state.items : []),
      })),
    })),
  };

  // A leitura de itens acontece dentro da transação, sem limit().
  tx.select = vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn(() => {
        if (table === purchaseOrders) return { limit: vi.fn().mockResolvedValue([state.purchaseOrder]) };
        if (table === purchaseOrderItems) return Promise.resolve(state.items);
        return { limit: vi.fn().mockResolvedValue([]) };
      }),
    })),
  }));

  return { db, state, tx };
}

function createAdminCaller() {
  const ctx = {
    user: {
      id: 9,
      openId: "purchase-admin",
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

describe("integração do recebimento de compra", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recebe uma única vez, grava o movimento e mantém a segunda tentativa idempotente", async () => {
    const { db, state, tx } = createPurchaseReceiveDb();
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(createAdminCaller().purchaseOrders.receive({ id: 801 })).resolves.toEqual({ success: true, alreadyReceived: false });
    await expect(createAdminCaller().purchaseOrders.receive({ id: 801 })).resolves.toEqual({ success: true, alreadyReceived: true });

    expect(tx.execute).toHaveBeenCalledTimes(3);
    expect(state.purchaseOrder.status).toBe("recebido");
    expect(state.product.stockQuantity).toBe(7);
    expect(state.movements).toEqual([
      expect.objectContaining({ productId: 35, type: "entrada", quantity: 3, referenceType: "purchase_order", referenceId: 801 }),
    ]);
  });
});
