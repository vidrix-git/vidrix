export type ProductCatalogForm = {
  name: string;
  type?: string | null;
  thickness?: string | null;
  color?: string | null;
  unitPrice: string;
  stockQuantity: number;
  minStockQuantity: number;
};

/**
 * Converte os valores da tela de catálogo para o contrato do router.
 * Largura e altura pertencem ao item vendido; no catálogo, o valor-base
 * zero preserva a compatibilidade com produtos legados e kits sem dimensão.
 */
export function toProductMutationInput(form: ProductCatalogForm) {
  return {
    name: form.name.trim(),
    type: form.type || null,
    thickness: form.thickness?.trim() || "N/A",
    color: form.color?.trim() || null,
    width: "0",
    height: "0",
    unitPrice: form.unitPrice,
    stockQuantity: String(form.stockQuantity),
    minStockQuantity: String(form.minStockQuantity),
  };
}
