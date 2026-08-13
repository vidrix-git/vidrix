export type StockHistoryRecord = {
  id: number;
  productId: number;
  type: "entrada" | "saida";
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: Date | string | null;
};

export function toStockMovementReportRow(movement: StockHistoryRecord, productName: string) {
  return {
    movementId: movement.id,
    productName,
    type: movement.type,
    quantity: movement.quantity,
    sourceType: movement.referenceType || "manual",
    reference: movement.referenceId ? `#${movement.referenceId}` : "-",
    movementDate: movement.createdAt ? new Date(movement.createdAt).toLocaleDateString("pt-BR") : "-",
  };
}
