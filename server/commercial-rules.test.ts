import { describe, expect, it } from "vitest";
import { calculateCommercialItem, COMMERCIAL_MEASUREMENT_UNIT } from "./commercial-rules";

describe("commercial measurement rules", () => {
  it("uses centimeters and calculates square meters deterministically", () => {
    const item = calculateCommercialItem({ width: "100", height: "50", quantity: "2", unitPrice: "80" });

    expect(COMMERCIAL_MEASUREMENT_UNIT).toBe("cm");
    expect(item.squareMeters).toBe(0.5);
    expect(item.subtotal).toBe(80);
  });

  it("rejects zero, negative, non-numeric and fractional quantities", () => {
    expect(() => calculateCommercialItem({ width: "0", height: "50", quantity: "1", unitPrice: "80" })).toThrow("Largura");
    expect(() => calculateCommercialItem({ width: "100", height: "-1", quantity: "1", unitPrice: "80" })).toThrow("Altura");
    expect(() => calculateCommercialItem({ width: "100", height: "50", quantity: "1.5", unitPrice: "80" })).toThrow("Quantidade");
    expect(() => calculateCommercialItem({ width: "100", height: "50", quantity: "1", unitPrice: "abc" })).toThrow("Preço");
  });

  it("accepts Brazilian decimal notation for dimensions and prices", () => {
    const item = calculateCommercialItem({ width: "100,5", height: "50", quantity: "2", unitPrice: "80,50" });

    expect(item.width).toBe(100.5);
    expect(item.unitPrice).toBe(80.5);
    expect(item.squareMeters).toBe(0.5025);
    expect(item.subtotal).toBeCloseTo(80.9025, 8);
  });
});
