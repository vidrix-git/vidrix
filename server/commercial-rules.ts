export const COMMERCIAL_MEASUREMENT_UNIT = "cm";
export const AREA_DIVISOR_FOR_CENTIMETERS = 10_000;

export type CommercialItemInput = {
  width: string;
  height: string;
  quantity: string;
  unitPrice: string;
};

export type CalculatedCommercialItem = {
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  squareMeters: number;
  subtotal: number;
};

function parsePositiveDecimal(value: string, field: string): number {
  const compact = value.trim().replace(/\s+/g, "");
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${field} deve ser um número positivo`);
  }
  return parsed;
}

function parsePositiveInteger(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} deve ser um número inteiro positivo`);
  }
  return parsed;
}

/**
 * Commercial dimensions are always expressed in centimeters. The conversion
 * to square meters is therefore width × height ÷ 10,000.
 */
export function calculateCommercialItem(input: CommercialItemInput): CalculatedCommercialItem {
  const width = parsePositiveDecimal(input.width, "Largura em cm");
  const height = parsePositiveDecimal(input.height, "Altura em cm");
  const quantity = parsePositiveInteger(input.quantity, "Quantidade");
  const unitPrice = parsePositiveDecimal(input.unitPrice, "Preço por m²");
  const squareMeters = (width * height) / AREA_DIVISOR_FOR_CENTIMETERS;
  const subtotal = quantity * squareMeters * unitPrice;

  return { width, height, quantity, unitPrice, squareMeters, subtotal };
}

export function roundMoney(value: number): string {
  return value.toFixed(2);
}

export function roundSquareMeters(value: number): string {
  return value.toFixed(4);
}
