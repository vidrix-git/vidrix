/** Normaliza a digitação do operador para comparar códigos de catálogo sem diferenças de caixa ou espaço. */
export const normalizeCounterProductCode = (value: string) => value.trim().toLocaleUpperCase("pt-BR");

/** Localiza o produto pelo código único de catálogo; retorna nulo para código vazio ou não cadastrado. */
export function findCounterProductByCode<T extends { code?: string | null }>(products: T[], code: string): T | null {
  const normalized = normalizeCounterProductCode(code);
  if (!normalized) return null;
  return products.find((product) => normalizeCounterProductCode(product.code || "") === normalized) || null;
}
