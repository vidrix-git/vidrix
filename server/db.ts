import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * The Azure MySQL server starts with only the default database. Keep the ERP
 * schema bootstrap idempotent so a new production database becomes usable on
 * its first application start without touching existing operational data.
 */
export const ERP_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`clients\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`type\` enum('PF','PJ') NOT NULL,
    \`cpfCnpj\` varchar(255) NOT NULL,
    \`address\` text,
    \`phone\` varchar(255),
    \`email\` varchar(255),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`clients_cpfCnpj_unique\` (\`cpfCnpj\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`type\` varchar(255),
    \`thickness\` varchar(255) NOT NULL,
    \`color\` varchar(255),
    \`width\` decimal(10,2) NOT NULL,
    \`height\` decimal(10,2) NOT NULL,
    \`unitPrice\` decimal(10,2) NOT NULL,
    \`stockQuantity\` int NOT NULL DEFAULT 0,
    \`minStockQuantity\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`suppliers\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`cnpj\` varchar(255) NOT NULL,
    \`address\` text,
    \`phone\` varchar(255),
    \`email\` varchar(255),
    \`paymentTerms\` enum('a_vista','15_dias','30_dias') NOT NULL DEFAULT 'a_vista',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`suppliers_cnpj_unique\` (\`cnpj\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`openId\` varchar(64) NOT NULL,
    \`name\` text,
    \`email\` varchar(320),
    \`loginMethod\` varchar(64),
    \`role\` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
    \`password\` varchar(512),
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`users_openId_unique\` (\`openId\`)
  )`,
  `ALTER TABLE \`users\` MODIFY COLUMN \`role\` enum('user','admin','superadmin') NOT NULL DEFAULT 'user'`,
  `CREATE TABLE IF NOT EXISTS \`quotes\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`clientId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`status\` enum('rascunho','aprovado','rejeitado','convertido') NOT NULL DEFAULT 'rascunho',
    \`validUntil\` timestamp NULL,
    \`totalAmount\` decimal(12,2) NOT NULL DEFAULT '0',
    \`discount\` decimal(10,2) DEFAULT '0',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`quoteItems\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`quoteId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`width\` decimal(10,2) NOT NULL,
    \`height\` decimal(10,2) NOT NULL,
    \`quantity\` int NOT NULL,
    \`unitPrice\` decimal(10,2) NOT NULL,
    \`squareMeters\` decimal(10,4) NOT NULL,
    \`subtotal\` decimal(12,2) NOT NULL,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`orders\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`clientId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`quoteId\` int,
    \`status\` enum('aprovado','em_producao','pronto','entregue','cancelado') NOT NULL DEFAULT 'aprovado',
    \`totalAmount\` decimal(12,2) NOT NULL DEFAULT '0',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`orderItems\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`orderId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`width\` decimal(10,2) NOT NULL,
    \`height\` decimal(10,2) NOT NULL,
    \`quantity\` int NOT NULL,
    \`unitPrice\` decimal(10,2) NOT NULL,
    \`squareMeters\` decimal(10,4) NOT NULL,
    \`subtotal\` decimal(12,2) NOT NULL,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`purchaseOrders\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`supplierId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`status\` enum('pendente','confirmado','recebido','cancelado') NOT NULL DEFAULT 'pendente',
    \`totalAmount\` decimal(12,2) NOT NULL DEFAULT '0',
    \`expectedDeliveryDate\` timestamp NULL,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`purchaseOrderItems\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`purchaseOrderId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`quantity\` int NOT NULL,
    \`unitCost\` decimal(10,2) NOT NULL,
    \`subtotal\` decimal(12,2) NOT NULL,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`stockMovements\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`productId\` int NOT NULL,
    \`type\` enum('entrada','saida') NOT NULL,
    \`quantity\` int NOT NULL,
    \`referenceType\` varchar(50),
    \`referenceId\` int,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`legacyImportRecords\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sourceTable\` varchar(100) NOT NULL,
    \`sourceHash\` varchar(64) NOT NULL,
    \`recordType\` varchar(64) NOT NULL,
    \`legacyCode\` varchar(100),
    \`payload\` text NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`legacy_import_source_hash_unique\` (\`sourceTable\`, \`sourceHash\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`cuttingRules\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`category\` varchar(32) NOT NULL,
    \`cutValue\` decimal(10,2) NOT NULL,
    \`saleValue\` decimal(10,2) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`cutting_rules_category_cut_unique\` (\`category\`, \`cutValue\`)
  )`,
] as const;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection is not configured");

      try {
        for (const statement of ERP_SCHEMA_STATEMENTS) {
          await db.execute(statement);
        }
        console.log("[Database] ERP schema is ready");
      } catch (error) {
        schemaReady = null;
        throw error;
      }
    })();
  }

  return schemaReady;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
