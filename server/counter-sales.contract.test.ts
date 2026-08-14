import { describe, expect, it } from "vitest";
import { createCounterSaleSchema, finalizeCounterTransactionSchema } from "../shared/schemas";

describe("contrato de venda direta", () => {
  it("aceita uma venda de balcão com item comercial válido", () => {
    const sale = createCounterSaleSchema.parse({ clientId: 1, items: [{ productId: 2, width: "100", height: "80", quantity: "1", unitPrice: "120" }] });
    expect(sale.items).toHaveLength(1);
  });
  it("recusa a venda sem itens", () => {
    expect(() => createCounterSaleSchema.parse({ clientId: 1, items: [] })).toThrow("Adicione pelo menos um item");
  });

  it("aceita encerrar os mesmos itens como orçamento com complemento comercial", () => {
    const transaction = finalizeCounterTransactionSchema.parse({
      outcome: "quote",
      clientId: 1,
      items: [{ productId: 2, width: "100", height: "80", quantity: "1", unitPrice: "120" }],
      extras: [{ kind: "acessorio", description: "Botão", unit: "un", quantity: "2", unitPrice: "2,50" }],
    });
    expect(transaction.outcome).toBe("quote");
    expect(transaction.extras).toHaveLength(1);
  });

  it("exige um cliente existente em potencial para concluir orçamento ou venda", () => {
    expect(() => finalizeCounterTransactionSchema.parse({
      outcome: "sale",
      items: [{ productId: 2, width: "100", height: "80", quantity: "1", unitPrice: "120" }],
      extras: [],
    })).toThrow();
  });
});
