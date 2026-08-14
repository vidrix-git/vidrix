export function buildInternalProductCode(id: number): string {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("O identificador do produto precisa ser um inteiro positivo");
  }

  return `PRD-${id}`;
}
