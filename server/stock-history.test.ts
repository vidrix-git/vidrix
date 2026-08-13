import { describe, expect, it } from "vitest";
import { toStockMovementReportRow } from "./stock-history";

describe("histórico auditável de estoque", () => {
  it("preserva tipo, origem, referência e data de um estorno de pedido", () => {
    expect(toStockMovementReportRow({
      id: 7,
      productId: 3,
      type: "entrada",
      quantity: 2,
      referenceType: "order_cancel",
      referenceId: 41,
      createdAt: new Date("2026-08-13T12:00:00.000Z"),
    }, "Vidro Incolor")).toMatchObject({
      movementId: 7,
      productName: "Vidro Incolor",
      type: "entrada",
      quantity: 2,
      sourceType: "order_cancel",
      reference: "#41",
    });
  });
});
