import { describe, expect, it } from "vitest";
import { shouldOpenCounterPriceDecision } from "../shared/counter-sale-keyboard";

describe("decisão pelo preço no Balcão", () => {
  it("abre a decisão apenas para Enter simples no campo Preço", () => {
    expect(shouldOpenCounterPriceDecision({ key: "Enter" })).toBe(true);
    expect(shouldOpenCounterPriceDecision({ key: "Enter", shiftKey: true })).toBe(false);
    expect(shouldOpenCounterPriceDecision({ key: "Enter", ctrlKey: true })).toBe(false);
    expect(shouldOpenCounterPriceDecision({ key: "Tab" })).toBe(false);
  });
});
