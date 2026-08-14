import { describe, expect, it } from "vitest";
import { buildInternalProductCode } from "../shared/catalog-product-code";
import { ERP_SCHEMA_STATEMENTS } from "./db";

describe("código pesquisável de catálogo", () => {
  it("gera um código interno estável para produto criado sem código informado", () => {
    expect(buildInternalProductCode(42)).toBe("PRD-42");
  });

  it("rejeita identificadores inválidos para não gerar códigos ambíguos", () => {
    expect(() => buildInternalProductCode(0)).toThrow("inteiro positivo");
    expect(() => buildInternalProductCode(1.5)).toThrow("inteiro positivo");
  });

  it("preserva a origem KF/KC dos kits do MDB antes de gerar o fallback interno", () => {
    const bootstrap = ERP_SCHEMA_STATEMENTS.join("\n");
    expect(bootstrap).toContain("WHEN 'KIt_Fontal' THEN 'KF-'");
    expect(bootstrap).toContain("WHEN 'Kit_Canto' THEN 'KC-'");
    expect(bootstrap).toContain("CONCAT('PRD-', `id`)");
  });
});
