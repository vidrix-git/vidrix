import { eq, and, desc, asc, like, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    const assignNullable = (field: typeof textFields[number]) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
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
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// CLIENTS
// ============================================================
import { clients, InsertClient, Client, products, InsertProduct, Product, suppliers, InsertSupplier, Supplier, supplierPrices, InsertSupplierPrice, SupplierPrice, quotes, InsertQuote, Quote, quoteItems, InsertQuoteItem, QuoteItem, orders, InsertOrder, Order, orderItems, InsertOrderItem, OrderItem, purchaseOrders, InsertPurchaseOrder, PurchaseOrder, purchaseOrderItems, InsertPurchaseOrderItem, PurchaseOrderItem, stockMovements, InsertStockMovement, StockMovement } from "../drizzle/schema";

export async function listClients(filters?: { search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters?.search
    ? and(like(clients.name, `%${filters.search}%`), like(clients.cpfCnpj, `%${filters.search}%`))
    : undefined;
  return db.select().from(clients).where(conditions).orderBy(desc(clients.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getClient(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0];
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// ============================================================
// PRODUCTS
// ============================================================
export async function listProducts(filters?: { search?: string; category?: string; active?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters
    ? and(
        filters.search ? like(products.name, `%${filters.search}%`) : undefined,
        filters.category ? eq(products.category, filters.category) : undefined,
        filters.active !== undefined ? eq(products.active, filters.active) : undefined,
      )
    : undefined;
  return db.select().from(products).where(conditions).orderBy(desc(products.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getProduct(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ============================================================
// SUPPLIERS
// ============================================================
export async function listSuppliers(filters?: { search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters?.search
    ? and(like(suppliers.name, `%${filters.search}%`), like(suppliers.cnpj, `%${filters.search}%`))
    : undefined;
  return db.select().from(suppliers).where(conditions).orderBy(desc(suppliers.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getSupplier(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return result[0];
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ============================================================
// SUPPLIER PRICES
// ============================================================
export async function listSupplierPrices(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierPrices).where(eq(supplierPrices.supplierId, supplierId));
}

export async function getSupplierPriceByProduct(supplierId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(supplierPrices)
    .where(and(eq(supplierPrices.supplierId, supplierId), eq(supplierPrices.productId, productId)))
    .limit(1);
  return result[0];
}

export async function upsertSupplierPrice(data: InsertSupplierPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(supplierPrices).values(data).onDuplicateKeyUpdate({
    set: { unitPrice: data.unitPrice, leadTimeDays: data.leadTimeDays, notes: data.notes, updatedAt: new Date() },
  });
}

export async function deleteSupplierPrice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierPrices).where(eq(supplierPrices.id, id));
}

// ============================================================
// QUOTES
// ============================================================
export async function listQuotes(filters?: { status?: string; clientId?: number; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters
    ? and(
        filters.status ? eq(quotes.status, filters.status as any) : undefined,
        filters.clientId ? eq(quotes.clientId, filters.clientId) : undefined,
        filters.search ? like(quotes.number, `%${filters.search}%`) : undefined,
      )
    : undefined;
  return db.select().from(quotes).where(conditions).orderBy(desc(quotes.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getQuote(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result[0];
}

export async function getQuoteItems(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function createQuote(data: InsertQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quotes).values(data);
  return result[0];
}

export async function updateQuote(id: number, data: Partial<InsertQuote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quotes).set(data).where(eq(quotes.id, id));
}

export async function createQuoteItem(data: InsertQuoteItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quoteItems).values(data);
  return result[0];
}

export async function deleteQuoteItems(quoteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function deleteQuote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  await db.delete(quotes).where(eq(quotes.id, id));
}

// ============================================================
// ORDERS
// ============================================================
export async function listOrders(filters?: { status?: string; clientId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters
    ? and(
        filters.status ? eq(orders.status, filters.status as any) : undefined,
        filters.clientId ? eq(orders.clientId, filters.clientId) : undefined,
      )
    : undefined;
  return db.select().from(orders).where(conditions).orderBy(desc(orders.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getOrder(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return result[0];
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

export async function createOrderItem(data: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(data);
  return result[0];
}

export async function deleteOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

// ============================================================
// PURCHASE ORDERS
// ============================================================
export async function listPurchaseOrders(filters?: { status?: string; supplierId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters
    ? and(
        filters.status ? eq(purchaseOrders.status, filters.status as any) : undefined,
        filters.supplierId ? eq(purchaseOrders.supplierId, filters.supplierId) : undefined,
      )
    : undefined;
  return db.select().from(purchaseOrders).where(conditions).orderBy(desc(purchaseOrders.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function getPurchaseOrder(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}

export async function getPurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function createPurchaseOrder(data: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseOrders).values(data);
  return result[0];
}

export async function updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
}

export async function createPurchaseOrderItem(data: InsertPurchaseOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseOrderItems).values(data);
  return result[0];
}

export async function deletePurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function deletePurchaseOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export async function listStockMovements(filters?: { productId?: number; type?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = filters
    ? and(
        filters.productId ? eq(stockMovements.productId, filters.productId) : undefined,
        filters.type ? eq(stockMovements.type, filters.type as any) : undefined,
      )
    : undefined;
  return db.select().from(stockMovements).where(conditions).orderBy(desc(stockMovements.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
}

export async function createStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockMovements).values(data);
  return result[0];
}

export async function updateProductStock(productId: number, quantityChange: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({
    stockQuantity: sql`${products.stockQuantity} + ${quantityChange}`,
    updatedAt: new Date(),
  }).where(eq(products.id, productId));
}

// ============================================================
// DASHBOARD / REPORTS
// ============================================================
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const totalRevenue = await db.select({ total: sql`COALESCE(SUM(${orders.totalValue}), 0)` })
    .from(orders).where(and(eq(orders.status, "delivered" as any), gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))));

  const ordersByStatus = await db.select({ status: orders.status, count: sql`COUNT(*)` })
    .from(orders).groupBy(orders.status);

  const criticalStock = await db.select()
    .from(products).where(sql`${products.stockQuantity} <= ${products.minStock}`).limit(20);

  return {
    totalRevenue: parseFloat(totalRevenue[0]?.total as string) || 0,
    ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: Number(o.count) })),
    criticalStock,
  };
}

export async function getRevenueReport(startDate: string, endDate: string): Promise<Array<{ date: string; total: number; count: number }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT DATE(createdAt) as date, COALESCE(SUM(CAST(totalValue AS DECIMAL(14,2))), 0) as total, COUNT(*) as count FROM orders WHERE status = 'delivered' AND createdAt >= ${startDate} AND createdAt <= ${endDate} GROUP BY DATE(createdAt) ORDER BY DATE(createdAt) ASC`
  );
  return rows as any;
}
