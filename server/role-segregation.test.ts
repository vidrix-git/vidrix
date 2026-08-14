import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function createCaller(role: "user" | "admin" | "superadmin") {
  return appRouter.createCaller({
    user: {
      id: 1,
      openId: `local:${role}`,
      name: role,
      email: `${role}@vidrix.local`,
      role,
      loginMethod: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  });
}

describe("segregação operacional por papel", () => {
  it("bloqueia utilizador comum de receber compras, ajustar saldo e cancelar pedido", async () => {
    const caller = createCaller("user");

    await expect(caller.purchaseOrders.receive({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.stockMovements.manualEntry({ productId: 1, type: "entrada", quantity: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.orders.updateStatus({ id: 1, status: "cancelado", cancellationReason: "Teste de acesso" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia utilizador comum de alterar catálogo de produtos e fornecedores", async () => {
    const caller = createCaller("user");

    await expect(caller.products.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.suppliers.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("mantém a venda de balcão como operação disponível ao utilizador autenticado", async () => {
    const caller = createCaller("user");

    await expect(caller.counterSales.getOrder({ id: 1 })).rejects.not.toMatchObject({ code: "FORBIDDEN" });
  });
});
