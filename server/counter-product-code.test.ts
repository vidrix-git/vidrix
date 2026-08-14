import { describe, expect, it } from "vitest";
import { findCounterProductByCode, normalizeCounterProductCode, shouldResolveCounterProductCode } from "../shared/counter-product-code";

describe("consulta de código no Balcão", () => {
  const products = [
    { id: 1, code: "KF-1", name: "Kit frontal" },
    { id: 2, code: "KC-1", name: "Kit canto" },
  ];

  it("normaliza a digitação do operador antes da consulta", () => {
    expect(normalizeCounterProductCode("  kf-1 ")).toBe("KF-1");
  });

  it("seleciona o produto correto pelo código sem confundir códigos legados repetidos", () => {
    expect(findCounterProductByCode(products, "kc-1")).toMatchObject({ id: 2, code: "KC-1" });
    expect(findCounterProductByCode(products, "1")).toBeNull();
  });

  it("reserva Enter para confirmar o código antes do avanço global de foco", () => {
    expect(shouldResolveCounterProductCode("Enter")).toBe(true);
    expect(shouldResolveCounterProductCode("Tab")).toBe(false);
    expect(shouldResolveCounterProductCode("ArrowDown")).toBe(false);
  });
});
