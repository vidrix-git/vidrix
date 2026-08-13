import { describe, expect, it } from "vitest";
import { ERP_SCHEMA_STATEMENTS } from "./db";

describe("bootstrap do esquema ERP", () => {
  it("define todas as treze tabelas necessárias de forma idempotente", () => {
    const schemaSql = ERP_SCHEMA_STATEMENTS.join("\n");

    expect(ERP_SCHEMA_STATEMENTS).toHaveLength(13);
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `users`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `quotes`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `stockMovements`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `legacyImportRecords`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `cuttingRules`");
  });
});
