import { describe, expect, it } from "vitest";
import { moveCounterPriceDecision, shouldOpenCounterPriceDecision } from "../shared/counter-sale-keyboard";

describe("decisão pelo preço no Balcão", () => {
  it("abre a decisão apenas para Enter simples no campo Preço", () => {
    expect(shouldOpenCounterPriceDecision({ key: "Enter" })).toBe(true);
    expect(shouldOpenCounterPriceDecision({ key: "Enter", shiftKey: true })).toBe(false);
    expect(shouldOpenCounterPriceDecision({ key: "Enter", ctrlKey: true })).toBe(false);
    expect(shouldOpenCounterPriceDecision({ key: "Tab" })).toBe(false);
  });

  it("alterna a decisão entre adicionar e finalizar com as setas", () => {
    expect(moveCounterPriceDecision("add", "ArrowRight")).toBe("finish");
    expect(moveCounterPriceDecision("finish", "ArrowLeft")).toBe("add");
    expect(moveCounterPriceDecision("add", "Enter")).toBe("add");
  });
});
