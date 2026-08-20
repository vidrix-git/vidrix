export const SELLER_ALLOWED_PROCEDURES = new Set([
  "clients.list",
  "clients.get",
  "clients.create",
  "clients.update",
  "clients.lookupCep",
  "products.list",
  "products.get",
  "counterSales.create",
  "counterSales.finalize",
  "counterSales.getOrder",
  "quotes.list",
  "quotes.get",
  "quotes.getItems",
  "quotes.create",
  "quotes.update",
  "quotes.delete",
  "quotes.addItem",
  "quotes.updateItem",
  "quotes.deleteItem",
  "orders.list",
  "orders.get",
  "orders.getItems",
]);

export function canSellerCall(path: string) {
  return SELLER_ALLOWED_PROCEDURES.has(path);
}

export function isSellerRoute(path: string) {
  return ["/counter-sale", "/clients", "/quotes", "/orders"].includes(path);
}
