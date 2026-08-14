import { describe, expect, it } from "vitest";
import { createCounterSaleSchema } from "../shared/schemas";

describe("contrato de venda direta", () => {
  it("aceita uma venda de balcão com item comercial válido", () => {
    const sale = createCounterSaleSchema.parse({ clientId: 1, items: [{ productId: 2, width: "100", height: "80", quantity: "1", unitPrice: "120" }] });
    expect(sale.items).toHaveLength(1);
  });
  it("recusa a venda sem itens", () => {
    expect(() => createCounterSaleSchema.parse({ clientId: 1, items: [] })).toThrow("Adicione pelo menos um item");
  });
});
