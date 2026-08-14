import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("..", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

describe("contrato responsivo dos formulários", () => {
  it("mantém itens de orçamento e compra em grades adaptáveis", () => {
    const quotes = source("client/src/pages/Quotes.tsx");
    const purchases = source("client/src/pages/Purchases.tsx");
    const orders = source("client/src/pages/Orders.tsx");
    const stock = source("client/src/pages/Stock.tsx");

    expect(quotes).toContain("grid grid-cols-2 gap-3");
    expect(quotes).toContain("sm:grid-cols-12");
    expect(purchases).toContain("grid grid-cols-2 gap-3");
    expect(purchases).toContain("sm:grid-cols-12");
    expect(quotes).not.toContain("flex items-end gap-2 p-3 border rounded-lg bg-secondary/30");
    expect(purchases).not.toContain("flex items-end gap-2 p-3 border rounded-lg bg-secondary/30");
    expect(orders).toContain("overflow-x-auto pb-2");
    expect(orders).toContain("min-w-[58rem] grid-cols-5");
    expect(stock).toContain("overflow-x-auto p-0");
    expect(stock).toContain("<Table className=\"min-w-[44rem]\">");
  });

  it("limita a altura dos diálogos e empilha ações em telas estreitas", () => {
    const dialog = source("client/src/components/ui/dialog.tsx");
    const clients = source("client/src/pages/Clients.tsx");
    const products = source("client/src/pages/Products.tsx");
    const suppliers = source("client/src/pages/Suppliers.tsx");

    expect(dialog).toContain("max-h-[calc(100dvh-2rem)]");
    expect(dialog).toContain("overflow-y-auto");
    for (const page of [clients, products, suppliers]) {
      expect(page).toContain("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end");
    }
  });
});
