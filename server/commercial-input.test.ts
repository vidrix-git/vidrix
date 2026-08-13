import { describe, expect, it } from "vitest";
import { createOrderItemSchema, createQuoteItemSchema, updateOrderItemSchema } from "../shared/schemas";

const validItem = { productId: 1, width: "100,5", height: "50", quantity: "2", unitPrice: "80,50" };

describe("contratos comerciais de item", () => {
  it("aceita centímetros e preço em notação decimal brasileira para orçamento e pedido", () => {
    expect(createQuoteItemSchema.safeParse({ quoteId: 1, ...validItem }).success).toBe(true);
    expect(createOrderItemSchema.safeParse({ orderId: 1, ...validItem }).success).toBe(true);
  });

  it("rejeita medidas, preço e quantidade comercialmente inválidos", () => {
    expect(createOrderItemSchema.safeParse({ orderId: 1, ...validItem, width: "0" }).success).toBe(false);
    expect(createOrderItemSchema.safeParse({ orderId: 1, ...validItem, height: "-1" }).success).toBe(false);
    expect(createOrderItemSchema.safeParse({ orderId: 1, ...validItem, quantity: "1.5" }).success).toBe(false);
    expect(createOrderItemSchema.safeParse({ orderId: 1, ...validItem, unitPrice: "invalido" }).success).toBe(false);
    expect(updateOrderItemSchema.safeParse({ id: 4, width: "0" }).success).toBe(false);
    expect(updateOrderItemSchema.safeParse({ id: 4, quantity: "2.5" }).success).toBe(false);
    expect(updateOrderItemSchema.safeParse({ id: 4, unitPrice: "80,50" }).success).toBe(true);
  });
});
