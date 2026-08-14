import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("..", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

describe("operação integral por teclado", () => {
  it("instala o navegador de teclado acima de todas as rotas do ERP", () => {
    const app = source("client/src/App.tsx");
    const navigator = source("client/src/components/KeyboardNavigator.tsx");

    expect(app).toContain("<KeyboardNavigator><Router /></KeyboardNavigator>");
    expect(navigator).toContain('const root = target.closest<HTMLElement>("[data-keyboard-scope], [role=\'dialog\']") ?? document.body');
    expect(navigator).toContain('event.key !== "Enter"');
    expect(navigator).toContain("moveFocus(target, event.shiftKey)");
    expect(navigator).toContain("target instanceof HTMLTextAreaElement");
  });

  it("preserva a seleção por Enter e a confirmação nativa dos controles", () => {
    const navigator = source("client/src/components/KeyboardNavigator.tsx");

    expect(navigator).toContain("target instanceof HTMLSelectElement");
    expect(navigator).toContain('target.dataset.keyboardSelection = "true"');
    expect(navigator).toContain('if (target.dataset.keyboardSelection === "true")');
    expect(navigator).toContain("if (target === document.activeElement) moveFocus(target)");
    expect(navigator).toContain('querySelector<HTMLElement>(\'[role="combobox"]\')');
  });

  it("mantém os módulos críticos dentro da cobertura global e com controles focáveis", () => {
    const modules = [
      "client/src/pages/Clients.tsx",
      "client/src/pages/Products.tsx",
      "client/src/pages/Suppliers.tsx",
      "client/src/pages/Purchases.tsx",
      "client/src/pages/Reports.tsx",
      "client/src/pages/Quotes.tsx",
      "client/src/pages/Orders.tsx",
      "client/src/pages/CounterSale.tsx",
    ];

    for (const modulePath of modules) {
      const page = source(modulePath);
      expect(page, modulePath).toMatch(/<(Input|Button|select|Select)/);
    }

    expect(source("client/src/pages/Stock.tsx")).toContain("<Table");
  });
});
