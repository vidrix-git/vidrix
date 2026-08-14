import { describe, expect, it } from "vitest";
import { ERP_SCHEMA_STATEMENTS } from "./db";

describe("bootstrap do esquema ERP", () => {
  it("define todas as quatorze tabelas necessárias e evolui papéis e auditoria de pedidos", () => {
    const schemaSql = ERP_SCHEMA_STATEMENTS.join("\n");

    expect(schemaSql.match(/CREATE TABLE IF NOT EXISTS/g)).toHaveLength(14);
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `users`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `quotes`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `stockMovements`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `legacyImportRecords`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `cuttingRules`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `commercialExtras`");
    expect(schemaSql).toContain("MODIFY COLUMN `role` enum('user','admin','superadmin')");
    expect(schemaSql).toContain("`stockAllocatedAt` timestamp NULL");
    expect(schemaSql).toContain("`cancelledAt` timestamp NULL");
    expect(schemaSql).toContain("`cancelledByUserId` int NULL");
    expect(schemaSql).toContain("`cancellationReason` text");
    expect(schemaSql).toContain("ADD COLUMN `cancelledAt` timestamp NULL");
    expect(schemaSql).toContain("SET `stockAllocatedAt` = `createdAt`");
  });
});
