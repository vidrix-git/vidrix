import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { createOrderSchema, updateOrderSchema, createOrderItemSchema, updateOrderItemSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { orders, orderItems, products, stockMovements } from "../../drizzle/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { calculateCommercialItem, roundMoney, roundSquareMeters } from "../commercial-rules";
import { orderStockReference, resolveOrderStatusTransition } from "../order-lifecycle";

function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result as any;
  return Number((header as any)?.affectedRows || 0);
}

async function refreshOrderTotal(tx: any, orderId: number) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const total = items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
  await tx.update(orders).set({ totalAmount: roundMoney(total) }).where(eq(orders.id, orderId));
}

async function changeStock(
  tx: any,
  productId: number,
  quantity: number,
  type: "entrada" | "saida",
  orderId: number,
  notes: string,
  referenceType: string,
) {
  await tx.execute(sql`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`);
  const result = type === "saida"
    ? await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` }).where(and(eq(products.id, productId), gte(products.stockQuantity, quantity)))
    : await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${quantity}` }).where(eq(products.id, productId));
  if (affectedRows(result) !== 1) throw new Error(`Estoque insuficiente para o produto #${productId}`);
  await tx.insert(stockMovements).values({
    productId, type, quantity, referenceType, referenceId: orderId, notes,
  });
}

export const ordersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orders).orderBy(orders.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(orders).where(eq(orders.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Pedido não encontrado");
    return result[0];
  }),

  getItems: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orderItems).where(eq(orderItems.orderId, opts.input.id));
  }),

  create: protectedProcedure.input(createOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(orders).values({ ...opts.input, userId: opts.ctx.user?.id ?? 0 } as any);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, status: _ignoredStatus, ...data } = opts.input;
    if (_ignoredStatus !== undefined) throw new Error("Use a alteração de status auditável para atualizar o pedido");
    await db.update(orders).set(data as any).where(eq(orders.id, id));
    return { success: true };
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number().int().positive(),
    status: z.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]),
    cancellationReason: z.string().trim().max(500).optional(),
  })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM orders WHERE id = ${opts.input.id} FOR UPDATE`);
      const records = await tx.select().from(orders).where(eq(orders.id, opts.input.id)).limit(1);
      if (records.length === 0) throw new Error("Pedido não encontrado");
      const order = records[0] as any;
      const transition = resolveOrderStatusTransition(order.status, opts.input.status, order.stockAllocatedAt);
      if (transition.unchanged) return { success: true, unchanged: true };

      if (transition.isCancellation) {
        if (transition.shouldRestock) {
          const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
          for (const item of items) {
            await changeStock(tx, item.productId, item.quantity, "entrada", order.id, `Estorno único pelo cancelamento do pedido #${order.id}`, orderStockReference("cancel"));
          }
        }
        await tx.update(orders).set({
          status: "cancelado",
          cancelledAt: new Date(),
          cancelledByUserId: opts.ctx.user?.id ?? null,
          cancellationReason: opts.input.cancellationReason || "Cancelamento registrado pelo usuário",
        }).where(eq(orders.id, order.id));
        return { success: true, cancelled: true };
      }

      await tx.update(orders).set({ status: opts.input.status }).where(eq(orders.id, order.id));
      return { success: true, cancelled: false };
    });
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async () => {
    throw new Error("Pedidos operacionais não podem ser excluídos. Use o cancelamento auditável.");
  }),

  addItem: adminProcedure.input(createOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const calculated = calculateCommercialItem(opts.input);
    return db.transaction(async (tx) => {
      const orderList = await tx.select().from(orders).where(eq(orders.id, opts.input.orderId)).limit(1);
      if (orderList.length === 0) throw new Error("Pedido não encontrado");
      if (orderList[0].status === "cancelado") throw new Error("Não é possível adicionar itens a um pedido cancelado");
      const result = await tx.insert(orderItems).values({
        orderId: opts.input.orderId, productId: opts.input.productId, width: String(calculated.width), height: String(calculated.height),
        quantity: calculated.quantity, unitPrice: String(calculated.unitPrice), squareMeters: roundSquareMeters(calculated.squareMeters), subtotal: roundMoney(calculated.subtotal), notes: opts.input.notes,
      });
      await changeStock(tx, opts.input.productId, calculated.quantity, "saida", opts.input.orderId, `Reserva pelo pedido #${opts.input.orderId}`, orderStockReference("reserve"));
      await tx.update(orders).set({ stockAllocatedAt: new Date() }).where(eq(orders.id, opts.input.orderId));
      await refreshOrderTotal(tx, opts.input.orderId);
      return { success: true, insertId: result[0].insertId };
    });
  }),

  updateItem: adminProcedure.input(updateOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.transaction(async (tx) => {
      const currentList = await tx.select().from(orderItems).where(eq(orderItems.id, opts.input.id)).limit(1);
      if (currentList.length === 0) throw new Error("Item não encontrado");
      const current = currentList[0] as any;
      const orderList = await tx.select().from(orders).where(eq(orders.id, current.orderId)).limit(1);
      const order = orderList[0] as any;
      if (!order || order.status === "cancelado") throw new Error("Item de pedido cancelado não pode ser alterado");
      const calculated = calculateCommercialItem({
        width: opts.input.width ?? String(current.width), height: opts.input.height ?? String(current.height),
        quantity: opts.input.quantity ?? String(current.quantity), unitPrice: opts.input.unitPrice ?? String(current.unitPrice),
      });
      const delta = calculated.quantity - current.quantity;
      if (order.stockAllocatedAt && delta !== 0) {
        await changeStock(tx, current.productId, Math.abs(delta), delta > 0 ? "saida" : "entrada", order.id, delta > 0 ? `Ajuste de reserva no pedido #${order.id}` : `Estorno de ajuste no pedido #${order.id}`, orderStockReference("adjust"));
      }
      await tx.update(orderItems).set({
        width: String(calculated.width), height: String(calculated.height), quantity: calculated.quantity, unitPrice: String(calculated.unitPrice),
        squareMeters: roundSquareMeters(calculated.squareMeters), subtotal: roundMoney(calculated.subtotal), notes: opts.input.notes ?? current.notes,
      }).where(eq(orderItems.id, current.id));
      await refreshOrderTotal(tx, current.orderId);
      return { success: true };
    });
  }),

  deleteItem: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.transaction(async (tx) => {
      const itemList = await tx.select().from(orderItems).where(eq(orderItems.id, opts.input.id)).limit(1);
      if (itemList.length === 0) throw new Error("Item não encontrado");
      const item = itemList[0] as any;
      const orderList = await tx.select().from(orders).where(eq(orders.id, item.orderId)).limit(1);
      const order = orderList[0] as any;
      if (!order || order.status === "cancelado") throw new Error("Item de pedido cancelado não pode ser removido");
      if (order.stockAllocatedAt) await changeStock(tx, item.productId, item.quantity, "entrada", order.id, `Estorno por remoção de item do pedido #${order.id}`, orderStockReference("remove"));
      await tx.delete(orderItems).where(eq(orderItems.id, item.id));
      await refreshOrderTotal(tx, item.orderId);
      return { success: true };
    });
  }),
});
