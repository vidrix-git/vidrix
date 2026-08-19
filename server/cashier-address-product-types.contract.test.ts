import { describe, expect, it } from "vitest";
import { canCashierCall, isCashierOnlyRoute } from "../shared/cashier-access";
import { toClientMutationInput } from "../shared/client-contract";
import { createClientSchema, createProductTypeSchema, updateProductTypeSchema } from "../shared/schemas";

describe("contratos de vendedor de frente de caixa", () => {
  it("permite somente os dados e operações indispensáveis ao Balcão", () => {
    expect(canCashierCall("counterSales.finalize")).toBe(true);
    expect(canCashierCall("clients.create")).toBe(true);
    expect(canCashierCall("products.list")).toBe(true);
    expect(canCashierCall("orders.list")).toBe(false);
    expect(canCashierCall("reports.revenue")).toBe(false);
    expect(canCashierCall("employees.list")).toBe(false);
  });

  it("mantém o vendedor apenas na rota do Balcão", () => {
    expect(isCashierOnlyRoute("/counter-sale")).toBe(true);
    expect(isCashierOnlyRoute("/orders")).toBe(false);
    expect(isCashierOnlyRoute("/employees")).toBe(false);
  });
});

describe("contrato de endereço completo de cliente", () => {
  const validClient = { name: "Maria da Silva", type: "PF" as const, cpfCnpj: "529.982.247-25" };

  it("aceita e normaliza número e complemento separadamente", () => {
    const input = toClientMutationInput({ ...validClient, address: " Rua das Flores ", addressNumber: " 123-A ", addressComplement: " Apto 42 " });
    expect(input.address).toBe("Rua das Flores");
    expect(input.addressNumber).toBe("123-A");
    expect(input.addressComplement).toBe("Apto 42");
    expect(createClientSchema.parse(input)).toMatchObject({ addressNumber: "123-A", addressComplement: "Apto 42" });
  });

  it("mantém os novos campos opcionais quando não informados", () => {
    const input = toClientMutationInput(validClient);
    expect(input.addressNumber).toBeNull();
    expect(input.addressComplement).toBeNull();
  });
});

describe("contrato do catálogo de tipos de produto", () => {
  it("valida criação e edição com nome comercial", () => {
    expect(createProductTypeSchema.parse({ name: "Vidro temperado" })).toEqual({ name: "Vidro temperado" });
    expect(updateProductTypeSchema.parse({ id: 7, name: "Vidro laminado" })).toEqual({ id: 7, name: "Vidro laminado" });
  });

  it("rejeita tipos sem nome útil", () => {
    expect(() => createProductTypeSchema.parse({ name: " " })).toThrow();
  });
});
