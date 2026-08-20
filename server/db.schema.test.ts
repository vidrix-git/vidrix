import { describe, expect, it } from "vitest";
import { ERP_SCHEMA_STATEMENTS } from "./db";

describe("bootstrap do esquema ERP", () => {
  it("define todas as dezasseis tabelas necessárias e evolui perfis, marca, tipos, endereço e auditoria", () => {
    const schemaSql = ERP_SCHEMA_STATEMENTS.join("\n");

    expect(schemaSql.match(/CREATE TABLE IF NOT EXISTS/g)).toHaveLength(16);
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `users`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `brandSettings`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `quotes`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `stockMovements`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `legacyImportRecords`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `cuttingRules`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `commercialExtras`");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS `productTypes`");
    expect(schemaSql).toContain("enum('seller','admin','superadmin')");
    expect(schemaSql).toContain("`role` = 'seller'");
    expect(schemaSql).toContain("`addressNumber` varchar(32)");
    expect(schemaSql).toContain("`addressComplement` varchar(255)");
    expect(schemaSql).toContain("`stockAllocatedAt` timestamp NULL");
    expect(schemaSql).toContain("`cancelledAt` timestamp NULL");
    expect(schemaSql).toContain("`cancelledByUserId` int NULL");
    expect(schemaSql).toContain("`cancellationReason` text");
    expect(schemaSql).toContain("ADD COLUMN `cancelledAt` timestamp NULL");
    expect(schemaSql).toContain("SET `stockAllocatedAt` = `createdAt`");
  });
});
