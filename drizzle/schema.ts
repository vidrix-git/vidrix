import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  password: varchar("password", { length: 512 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// CLIENTS
// ============================================================
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["PF", "PJ"]).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 255 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 255 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type UpdateClient = typeof clients.$inferInsert;

// ============================================================
// PRODUCTS
// ============================================================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }),
  thickness: varchar("thickness", { length: 255 }).notNull(),
  color: varchar("color", { length: 255 }),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  minStockQuantity: int("minStockQuantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type UpdateProduct = typeof products.$inferInsert;

// ============================================================
// SUPPLIERS
// ============================================================
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 255 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 255 }),
  email: varchar("email", { length: 255 }),
  paymentTerms: mysqlEnum("paymentTerms", ["a_vista", "15_dias", "30_dias"]).default("a_vista").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type UpdateSupplier = typeof suppliers.$inferInsert;

// ============================================================
// QUOTES (Orçamentos)
// ============================================================
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["rascunho", "aprovado", "rejeitado", "convertido"]).default("rascunho").notNull(),
  validUntil: timestamp("validUntil"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type UpdateQuote = typeof quotes.$inferInsert;

// ============================================================
// QUOTE ITEMS (Itens de Orçamento)
// ============================================================
export const quoteItems = mysqlTable("quoteItems", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  productId: int("productId").notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  squareMeters: decimal("squareMeters", { precision: 10, scale: 4 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;
export type UpdateQuoteItem = typeof quoteItems.$inferInsert;

// ============================================================
// ORDERS (Pedidos de Venda)
// ============================================================
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  quoteId: int("quoteId"),
  status: mysqlEnum("status", ["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).default("aprovado").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type UpdateOrder = typeof orders.$inferInsert;

// ============================================================
// ORDER ITEMS (Itens de Pedido de Venda)
// ============================================================
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  squareMeters: decimal("squareMeters", { precision: 10, scale: 4 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type UpdateOrderItem = typeof orderItems.$inferInsert;

// ============================================================
// PURCHASE ORDERS (Pedidos de Compra)
// ============================================================
export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pendente", "confirmado", "recebido", "cancelado"]).default("pendente").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type UpdatePurchaseOrder = typeof purchaseOrders.$inferInsert;

// ============================================================
// PURCHASE ORDER ITEMS (Itens de Pedido de Compra)
// ============================================================
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
export type UpdatePurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// ============================================================
// STOCK MOVEMENTS (Movimentos de Estoque)
// ============================================================
export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["entrada", "saida"]).notNull(),
  quantity: int("quantity").notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

// ============================================================
// RELATIONS
// ============================================================
export const clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  orders: many(orders),
  purchaseOrders: many(purchaseOrders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  quoteItems: many(quoteItems),
  orderItems: many(orderItems),
  purchaseOrderItems: many(purchaseOrderItems),
  stockMovements: many(stockMovements),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, { fields: [quotes.clientId], references: [clients.id] }),
  user: one(users, { fields: [quotes.userId], references: [users.id] }),
  items: many(quoteItems),
  order: one(orders),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
  product: one(products, { fields: [quoteItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  quote: one(quotes, { fields: [orders.quoteId], references: [quotes.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [purchaseOrders.userId], references: [users.id] }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
}));
