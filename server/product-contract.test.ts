import { describe, expect, it } from "vitest";
import { createProductSchema } from "../shared/schemas";
import { toProductMutationInput } from "../shared/product-contract";

describe("contrato de cadastro de produtos", () => {
  it("serializa um produto de catálogo sem dimensões próprias no formato aceito pelo router", () => {
    const input = toProductMutationInput({
      name: "  TESTE - Vidro Incolor 4mm  ",
      type: "vidro_incolor",
      thickness: "4",
      color: "Incolor",
      unitPrice: "100,00",
      stockQuantity: 10,
      minStockQuantity: 1,
    });

    expect(input).toMatchObject({
      name: "TESTE - Vidro Incolor 4mm",
      width: "0",
      height: "0",
      stockQuantity: "10",
      minStockQuantity: "1",
    });
    expect(createProductSchema.parse(input)).toEqual(input);
  });

  it("preserva o marcador N/A quando a espessura não é informada", () => {
    const input = toProductMutationInput({
      name: "Kit de catálogo",
      type: "outro",
      thickness: "",
      color: null,
      unitPrice: "20",
      stockQuantity: 0,
      minStockQuantity: 0,
    });

    expect(input.thickness).toBe("N/A");
    expect(createProductSchema.parse(input)).toEqual(input);
  });
});
