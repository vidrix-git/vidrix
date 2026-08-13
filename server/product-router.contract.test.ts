import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { toProductMutationInput } from "../shared/product-contract";

const insertValues = vi.fn();
const updateWhere = vi.fn();
const updateSet = vi.fn();
const mockDb = {
  insert: vi.fn(),
  update: vi.fn(),
};

function createAuthenticatedCaller() {
  const ctx = {
    user: {
      id: 9,
      openId: "product-contract-admin",
      email: "admin@vidrix.local",
      name: "Administrador de teste",
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

describe("integração do contrato de produtos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockResolvedValue(mockDb as never);
    insertValues.mockResolvedValue([{ insertId: 71 }]);
    mockDb.insert.mockReturnValue({ values: insertValues });
    updateWhere.mockResolvedValue(undefined);
    updateSet.mockReturnValue({ where: updateWhere });
    mockDb.update.mockReturnValue({ set: updateSet });
  });

  it("aceita no router de criação o payload gerado pela tela de catálogo", async () => {
    const input = toProductMutationInput({
      name: "TESTE - Vidro Incolor",
      type: "vidro_incolor",
      thickness: "4",
      color: "Incolor",
      unitPrice: "100",
      stockQuantity: 10,
      minStockQuantity: 1,
    });

    const result = await createAuthenticatedCaller().products.create(input);

    expect(result).toEqual({ success: true, insertId: 71 });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      name: "TESTE - Vidro Incolor",
      width: "0",
      height: "0",
      unitPrice: "100",
      stockQuantity: 10,
      minStockQuantity: 1,
    }));
  });

  it("aceita no router de edição o mesmo contrato sem reintroduzir valores numéricos inválidos", async () => {
    const input = toProductMutationInput({
      name: "TESTE - Vidro Incolor revisado",
      type: "vidro_incolor",
      thickness: "4",
      color: "Incolor",
      unitPrice: "100",
      stockQuantity: 8,
      minStockQuantity: 1,
    });

    const result = await createAuthenticatedCaller().products.update({ id: 71, ...input });

    expect(result).toEqual({ success: true });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
      name: "TESTE - Vidro Incolor revisado",
      width: "0",
      height: "0",
      stockQuantity: 8,
      minStockQuantity: 1,
    }));
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });
});
