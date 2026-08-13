export type OrderLifecycleDecision = {
  unchanged: boolean;
  isCancellation: boolean;
  shouldRestock: boolean;
};

/**
 * Determines the one-way status behavior of an operational order. A cancelled
 * order is never reactivated; a new order must be created instead.
 */
export function resolveOrderStatusTransition(currentStatus: string, nextStatus: string, stockAllocatedAt: Date | string | null): OrderLifecycleDecision {
  if (currentStatus === nextStatus) {
    return { unchanged: true, isCancellation: false, shouldRestock: false };
  }
  if (currentStatus === "cancelado") {
    throw new Error("Pedido cancelado não pode ser reativado; crie um novo pedido");
  }
  const isCancellation = nextStatus === "cancelado";
  return {
    unchanged: false,
    isCancellation,
    shouldRestock: isCancellation && Boolean(stockAllocatedAt),
  };
}

export function orderStockReference(operation: "reserve" | "cancel" | "adjust" | "remove"): string {
  if (operation === "cancel") return "order_cancel";
  if (operation === "adjust") return "order_adjust";
  if (operation === "remove") return "order_item_remove";
  return "order";
}
