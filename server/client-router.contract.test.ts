import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { toClientMutationInput } from "../shared/client-contract";

const insertValues = vi.fn();
const updateWhere = vi.fn();
const updateSet = vi.fn();
const mockDb = { insert: vi.fn(), update: vi.fn(), select: vi.fn() };
let persistedClients: Array<{ id: number; name: string; type: "PF" | "PJ"; cpfCnpj: string; city: string | null }>;
let pendingClientUpdate: Record<string, unknown>;

function createAuthenticatedCaller() {
  const ctx = {
    user: {
      id: 12, openId: "client-contract-admin", email: "admin@vidrix.local",
      name: "Administrador de teste", loginMethod: "local", role: "admin",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("integração do contrato de clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistedClients = [{ id: 82, name: "Cliente de teste", type: "PF", cpfCnpj: "123.456.789-00", city: "Cidade inicial" }];
    vi.mocked(getDb).mockResolvedValue(mockDb as never);
    insertValues.mockResolvedValue([{ insertId: 82 }]);
    mockDb.insert.mockReturnValue({ values: insertValues });
    updateSet.mockImplementation((data) => {
      pendingClientUpdate = data;
      return { where: updateWhere };
    });
    updateWhere.mockImplementation(async () => {
      persistedClients = persistedClients.map((client) => client.id === 82 ? { ...client, ...pendingClientUpdate } : client);
    });
    mockDb.update.mockReturnValue({ set: updateSet });
    mockDb.select.mockReturnValue({
      from: () => ({
        orderBy: async () => persistedClients,
      }),
    });
  });

  it("envia tipo e CPF/CNPJ obrigatórios, convertendo os demais campos vazios em null", async () => {
    const input = toClientMutationInput({
      name: "Cliente de teste", type: "PF", cpfCnpj: "123.456.789-00",
      email: "", phone: "", address: "", city: "",
    });

    await expect(createAuthenticatedCaller().clients.create(input)).resolves.toEqual({ success: true, insertId: 82 });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      name: "Cliente de teste", type: "PF", cpfCnpj: "123.456.789-00",
      email: null, phone: null, address: null, city: null,
    }));
  });

  it("aceita a edição com os valores serializados pela tela", async () => {
    const input = toClientMutationInput({
      name: "Cliente de teste atualizado", type: "PJ", cpfCnpj: "12.345.678/0001-90",
      email: "contato@cliente.com", phone: "21999990000", address: "Rua A", city: "Rio de Janeiro",
    });

    await expect(createAuthenticatedCaller().clients.update({ id: 82, ...input })).resolves.toEqual({ success: true });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ type: "PJ", city: "Rio de Janeiro" }));
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });

  it("persiste a cidade atualizada e a devolve em uma nova consulta", async () => {
    const caller = createAuthenticatedCaller();
    const input = toClientMutationInput({
      name: "Cliente de teste", type: "PF", cpfCnpj: "123.456.789-00",
      city: "Cidade de Teste Atualizada",
    });

    await expect(caller.clients.update({ id: 82, ...input })).resolves.toEqual({ success: true });
    await expect(caller.clients.list()).resolves.toEqual([
      expect.objectContaining({ id: 82, city: "Cidade de Teste Atualizada" }),
    ]);
  });
});
