import { describe, expect, it } from "vitest";
import { orderStockReference, resolveOrderStatusTransition } from "./order-lifecycle";

describe("ciclo de vida auditável do pedido", () => {
  it("mantém a alteração de status idempotente", () => {
    expect(resolveOrderStatusTransition("pronto", "pronto", new Date())).toEqual({
      unchanged: true,
      isCancellation: false,
      shouldRestock: false,
    });
  });

  it("estorna somente pedidos que já reservaram estoque", () => {
    expect(resolveOrderStatusTransition("em_producao", "cancelado", new Date())).toMatchObject({
      unchanged: false,
      isCancellation: true,
      shouldRestock: true,
    });
    expect(resolveOrderStatusTransition("aprovado", "cancelado", null)).toMatchObject({
      isCancellation: true,
      shouldRestock: false,
    });
  });

  it("impede reativação de pedido cancelado", () => {
    expect(() => resolveOrderStatusTransition("cancelado", "pronto", new Date())).toThrow("não pode ser reativado");
  });

  it("mantém referências distintas para reserva, estorno e ajustes de estoque", () => {
    expect(orderStockReference("reserve")).toBe("order");
    expect(orderStockReference("cancel")).toBe("order_cancel");
    expect(orderStockReference("adjust")).toBe("order_adjust");
    expect(orderStockReference("remove")).toBe("order_item_remove");
  });
});
