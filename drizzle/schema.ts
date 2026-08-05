import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ============================================================
// USERS - Tabela de usuários do sistema
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// CLIENTS - Cadastro de clientes
// ============================================================
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================
// PRODUCTS - Cadastro de produtos com controle de estoque
// ============================================================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  unit: varchar("unit", { length: 20 }).default("un").notNull(),
  stockQuantity: decimal("stockQuantity", { precision: 12, scale: 4 }).notNull().default("0.0000"),
  minStock: decimal("minStock", { precision: 12, scale: 4 }).notNull().default("0.0000"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================
// SUPPLIERS - Cadastro de fornecedores
// ============================================================
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  contact: varchar("contact", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ============================================================
// SUPPLIER_PRICES - Tabela de preços por fornecedor
// ============================================================
export const supplierPrices = mysqlTable("supplier_prices", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  productId: int("productId").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  leadTimeDays: int("leadTimeDays").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierPrice = typeof supplierPrices.$inferSelect;
export type InsertSupplierPrice = typeof supplierPrices.$inferInsert;

// ============================================================
// QUOTES - Orçamentos
// ============================================================
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 50 }).notNull(),
  clientId: int("clientId").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected", "converted"]).notNull().default("draft"),
  totalValue: decimal("totalValue", { precision: 14, scale: 2 }).notNull().default("0.00"),
  validUntil: varchar("validUntil", { length: 10 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  convertedOrderId: int("convertedOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ============================================================
// QUOTE_ITEMS - Itens do orçamento
// ============================================================
export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  productId: int("productId").notNull(),
  description: text("description"),
  width: decimal("width", { precision: 10, scale: 2 }).notNull().default("0.00"),
  height: decimal("height", { precision: 10, scale: 2 }).notNull().default("0.00"),
  quantity: int("quantity").notNull().default(1),
  areaM2: decimal("areaM2", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

// ============================================================
// ORDERS - Pedidos de Venda
// ============================================================
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 50 }).notNull(),
  clientId: int("clientId").notNull(),
  status: mysqlEnum("status", ["approved", "production", "ready", "delivered", "cancelled"]).notNull().default("approved"),
  totalValue: decimal("totalValue", { precision: 14, scale: 2 }).notNull().default("0.00"),
  quoteId: int("quoteId"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ============================================================
// ORDER_ITEMS - Itens do pedido de venda
// ============================================================
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  description: text("description"),
  width: decimal("width", { precision: 10, scale: 2 }).notNull().default("0.00"),
  height: decimal("height", { precision: 10, scale: 2 }).notNull().default("0.00"),
  quantity: int("quantity").notNull().default(1),
  areaM2: decimal("areaM2", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ============================================================
// PURCHASE_ORDERS - Pedidos de Compra
// ============================================================
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 50 }).notNull(),
  supplierId: int("supplierId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "received", "cancelled"]).notNull().default("pending"),
  totalValue: decimal("totalValue", { precision: 14, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  receivedAt: timestamp("receivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ============================================================
// PURCHASE_ORDER_ITEMS - Itens do pedido de compra
// ============================================================
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull().default("0.0000"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  receivedQuantity: decimal("receivedQuantity", { precision: 12, scale: 4 }).default("0.0000"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// ============================================================
// STOCK_MOVEMENTS - Histórico de movimentos de estoque
// ============================================================
export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["in", "out"]).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;
