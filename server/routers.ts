import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { products } from "../drizzle/schema";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

function nextQuoteNumber() {
  return `ORC-${Date.now().toString(36).toUpperCase()}`;
}
function nextOrderNumber() {
  return `PED-${Date.now().toString(36).toUpperCase()}`;
}
function nextPurchaseOrderNumber() {
  return `PC-${Date.now().toString(36).toUpperCase()}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================
  // CLIENTS
  // ============================================================
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listClients(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getClient(input.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        cpfCnpj: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createClient({ ...input, createdAt: new Date(), updatedAt: new Date() } as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        cpfCnpj: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteClient(input.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // PRODUCTS
  // ============================================================
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), category: z.string().optional(), active: z.boolean().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listProducts(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProduct(input.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        category: z.string().optional(),
        description: z.string().optional(),
        unitPrice: z.string().min(1),
        unit: z.string().optional().default("un"),
        stockQuantity: z.string().optional().default("0"),
        minStock: z.string().optional().default("0"),
        active: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input }) => {
        return db.createProduct({ ...input, createdAt: new Date(), updatedAt: new Date() } as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        category: z.string().optional(),
        description: z.string().optional(),
        unitPrice: z.string(),
        unit: z.string().optional(),
        stockQuantity: z.string(),
        minStock: z.string(),
        active: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // SUPPLIERS
  // ============================================================
  suppliers: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listSuppliers(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getSupplier(input.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        cnpj: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        contact: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSupplier({ ...input, createdAt: new Date(), updatedAt: new Date() } as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        cnpj: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        contact: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSupplier(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteSupplier(input.id);
      return { success: true };
    }),
    prices: router({
      list: protectedProcedure.input(z.object({ supplierId: z.number() })).query(async ({ input }) => {
        return db.listSupplierPrices(input.supplierId);
      }),
      upsert: protectedProcedure
        .input(z.object({
          supplierId: z.number(),
          productId: z.number(),
          unitPrice: z.string(),
          leadTimeDays: z.number().optional().default(0),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.upsertSupplierPrice({ ...input, createdAt: new Date(), updatedAt: new Date() } as any);
          return { success: true };
        }),
      delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteSupplierPrice(input.id);
        return { success: true };
      }),
    }),
  }),

  // ============================================================
  // QUOTES (Orçamentos)
  // ============================================================
  quotes: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional(), clientId: z.number().optional(), search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listQuotes(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const quote = await db.getQuote(input.id);
      if (!quote) return null;
      const items = await db.getQuoteItems(input.id);
      return { ...quote, items };
    }),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        notes: z.string().optional(),
        validUntil: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          description: z.string().optional(),
          width: z.string(),
          height: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const number = nextQuoteNumber();
        const quote = await db.createQuote({
          number,
          clientId: input.clientId,
          status: "draft",
          totalValue: "0.00",
          validUntil: input.validUntil,
          notes: input.notes,
          createdBy: ctx.user?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        let totalValue = 0;
        for (const item of input.items) {
          const w = parseFloat(item.width) || 0;
          const h = parseFloat(item.height) || 0;
          const areaM2 = (w * h) / 10000;
          const qty = item.quantity || 1;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const totalItemValue = qty * areaM2 * unitPrice;
          totalValue += totalItemValue;

          await db.createQuoteItem({
            quoteId: (quote as any).insertId,
            productId: item.productId,
            description: item.description,
            width: item.width,
            height: item.height,
            quantity: qty,
            areaM2: areaM2.toFixed(4),
            unitPrice: item.unitPrice,
            totalValue: totalItemValue.toFixed(2),
            createdAt: new Date(),
          } as any);
        }

        await db.updateQuote((quote as any).insertId, { totalValue: totalValue.toFixed(2) });
        return { id: (quote as any).insertId, number };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        notes: z.string().optional(),
        validUntil: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          description: z.string().optional(),
          width: z.string(),
          height: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.deleteQuoteItems(input.id);
        await db.updateQuote(input.id, { clientId: input.clientId, notes: input.notes, validUntil: input.validUntil, updatedAt: new Date() });

        let totalValue = 0;
        for (const item of input.items) {
          const w = parseFloat(item.width) || 0;
          const h = parseFloat(item.height) || 0;
          const areaM2 = (w * h) / 10000;
          const qty = item.quantity || 1;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const totalItemValue = qty * areaM2 * unitPrice;
          totalValue += totalItemValue;

          await db.createQuoteItem({
            quoteId: input.id,
            productId: item.productId,
            description: item.description,
            width: item.width,
            height: item.height,
            quantity: qty,
            areaM2: areaM2.toFixed(4),
            unitPrice: item.unitPrice,
            totalValue: totalItemValue.toFixed(2),
            createdAt: new Date(),
          } as any);
        }

        await db.updateQuote(input.id, { totalValue: totalValue.toFixed(2) });
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteQuote(input.id);
      return { success: true };
    }),
    approve: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.updateQuote(input.id, { status: "approved", updatedAt: new Date() });
      return { success: true };
    }),
  }),

  // ============================================================
  // ORDERS (Pedidos de Venda)
  // ============================================================
  orders: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional(), clientId: z.number().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listOrders(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const order = await db.getOrder(input.id);
      if (!order) return null;
      const items = await db.getOrderItems(input.id);
      return { ...order, items };
    }),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        quoteId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const number = nextOrderNumber();
        const order = await db.createOrder({
          number,
          clientId: input.clientId,
          status: "approved",
          totalValue: "0.00",
          quoteId: input.quoteId,
          notes: input.notes,
          createdBy: ctx.user?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        if (input.quoteId) {
          const quoteItems = await db.getQuoteItems(input.quoteId);
          let totalValue = 0;
          for (const qi of quoteItems) {
            await db.createOrderItem({
              orderId: (order as any).insertId,
              productId: qi.productId,
              description: qi.description,
              width: qi.width,
              height: qi.height,
              quantity: qi.quantity,
              areaM2: qi.areaM2,
              unitPrice: qi.unitPrice,
              totalValue: qi.totalValue,
              createdAt: new Date(),
            } as any);
            totalValue += parseFloat(qi.totalValue);
          }
          await db.updateOrder((order as any).insertId, { totalValue: totalValue.toFixed(2) });
          await db.updateQuote(input.quoteId, { status: "converted", convertedOrderId: (order as any).insertId, updatedAt: new Date() });
        }

        return { id: (order as any).insertId, number };
      }),
    changeStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "production", "ready", "delivered", "cancelled"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrder(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });

        const oldStatus = order.status;
        const updates: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
        if (input.status === "delivered") {
          updates.deliveredAt = new Date();
        }

        await db.updateOrder(input.id, updates);

        // Update stock on delivery (subtract)
        if (input.status === "delivered" && oldStatus !== "delivered") {
          const items = await db.getOrderItems(input.id);
          for (const item of items) {
            const qty = parseFloat(item.areaM2) * (item.quantity || 1);
            await db.updateProductStock(item.productId, -qty);
            await db.createStockMovement({
              productId: item.productId,
              type: "out",
              quantity: qty.toString(),
              reason: "Entrega de pedido de venda",
              referenceId: input.id,
              referenceType: "order",
              createdBy: ctx.user?.id,
              createdAt: new Date(),
            } as any);
          }
        }

        // Restore stock on cancellation
        if (input.status === "cancelled" && oldStatus !== "cancelled" && oldStatus !== "delivered") {
          const items = await db.getOrderItems(input.id);
          for (const item of items) {
            const qty = parseFloat(item.areaM2) * (item.quantity || 1);
            await db.updateProductStock(item.productId, qty);
            await db.createStockMovement({
              productId: item.productId,
              type: "in",
              quantity: qty.toString(),
              reason: "Cancelamento de pedido de venda",
              referenceId: input.id,
              referenceType: "order",
              createdBy: ctx.user?.id,
              createdAt: new Date(),
            } as any);
          }
        }

        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteOrder(input.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // PURCHASE ORDERS (Pedidos de Compra)
  // ============================================================
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional(), supplierId: z.number().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listPurchaseOrders(input);
      }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const po = await db.getPurchaseOrder(input.id);
      if (!po) return null;
      const items = await db.getPurchaseOrderItems(input.id);
      return { ...po, items };
    }),
    create: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.string(),
          unitPrice: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const number = nextPurchaseOrderNumber();
        let totalValue = 0;
        for (const item of input.items) {
          totalValue += parseFloat(item.quantity) * parseFloat(item.unitPrice);
        }

        const po = await db.createPurchaseOrder({
          number,
          supplierId: input.supplierId,
          status: "pending",
          totalValue: totalValue.toFixed(2),
          notes: input.notes,
          createdBy: ctx.user?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        for (const item of input.items) {
          await db.createPurchaseOrderItem({
            purchaseOrderId: (po as any).insertId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalValue: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
            receivedQuantity: "0",
            createdAt: new Date(),
          } as any);
        }

        return { id: (po as any).insertId, number };
      }),
    receive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const po = await db.getPurchaseOrder(input.id);
        if (!po) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido de compra não encontrado" });

        await db.updatePurchaseOrder(input.id, { status: "received", receivedAt: new Date(), updatedAt: new Date() });

        const items = await db.getPurchaseOrderItems(input.id);
        for (const item of items) {
          const qty = parseFloat(item.quantity);
          await db.updateProductStock(item.productId, qty);
          await db.updatePurchaseOrder(item.id, { receivedQuantity: item.quantity } as any);
          await db.createStockMovement({
            productId: item.productId,
            type: "in",
            quantity: qty.toString(),
            reason: "Recebimento de pedido de compra",
            referenceId: input.id,
            referenceType: "purchaseOrder",
            createdBy: ctx.user?.id,
            createdAt: new Date(),
          } as any);
        }

        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deletePurchaseOrder(input.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // STOCK MOVEMENTS
  // ============================================================
  stock: router({
    list: protectedProcedure
      .input(z.object({ productId: z.number().optional(), type: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listStockMovements(input);
      }),
  }),

  // ============================================================
  // DASHBOARD
  // ============================================================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // ============================================================
  // REPORTS
  // ============================================================
  reports: router({
    revenue: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        return db.getRevenueReport(input.startDate, input.endDate);
      }),
    criticalStock: protectedProcedure.query(async () => {
      const result = await db.listProducts({ limit: 50 });
      return result.filter((p) => parseFloat(p.stockQuantity as string) <= parseFloat(p.minStock as string));
    }),
  }),
});

export type AppRouter = typeof appRouter;
