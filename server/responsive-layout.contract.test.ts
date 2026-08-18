import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("contrato de responsividade operacional", () => {
  it("mantém os diálogos de cadastro dentro da largura móvel e usa grades progressivas", () => {
    for (const page of ["Clients.tsx", "Products.tsx", "Suppliers.tsx"]) {
      const content = source(`client/src/pages/${page}`);
      expect(content, page).toContain("max-w-[calc(100vw-2rem)]");
      expect(content, page).toContain("grid-cols-1");
      expect(content, page).toContain("sm:grid-cols");
    }
  });

  it("protege as linhas extensas de orçamento e compra em telas reduzidas", () => {
    for (const page of ["Quotes.tsx", "Purchases.tsx"]) {
      const content = source(`client/src/pages/${page}`);
      expect(content, page).toContain("max-w-[calc(100vw-2rem)]");
      expect(content, page).toContain("grid-cols-2");
      expect(content, page).toContain("sm:grid-cols-12");
    }
  });

  it("preserva rolagem horizontal segura para os dados tabulares e Kanban", () => {
    expect(source("client/src/pages/Orders.tsx")).toContain("overflow-x-auto");
    expect(source("client/src/pages/Stock.tsx")).toContain("overflow-x-auto");
  });

  it("adapta o Balcão e o cadastro rápido de cliente ao espaço disponível", () => {
    const counter = source("client/src/pages/CounterSale.tsx");
    expect(counter).toContain("grid gap-3");
    expect(counter).toContain("sm:grid-cols-2");
    expect(counter).toContain("flex-col-reverse");
  });
});
