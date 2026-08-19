/**
 * A conta de vendedor de frente de caixa é deliberadamente limitada à
 * operação unificada de Balcão e aos dados mínimos para concluí-la.
 */
export const CASHIER_ALLOWED_PROCEDURES = new Set([
  "clients.list",
  "clients.create",
  "clients.lookupCep",
  "products.list",
  "products.get",
  "counterSales.create",
  "counterSales.finalize",
  "counterSales.getOrder",
]);

export function canCashierCall(procedurePath: string) {
  return CASHIER_ALLOWED_PROCEDURES.has(procedurePath);
}

export function isCashierOnlyRoute(path: string) {
  return path === "/counter-sale";
}
