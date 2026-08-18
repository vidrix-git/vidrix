// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { KeyboardNavigator } from "../client/src/components/KeyboardNavigator";

const h = createElement;

afterEach(() => cleanup());

const moduleCases = [
  { name: "Clientes", controls: ["input", "select", "input", "button"] },
  { name: "Produtos", controls: ["input", "select", "input", "button"] },
  { name: "Fornecedores", controls: ["input", "input", "textarea", "button"] },
  { name: "Pedidos de Compra", controls: ["select", "input", "input", "button"] },
  { name: "Estoque", controls: ["input", "select", "button"] },
  { name: "Relatórios", controls: ["select", "button"] },
  { name: "Orçamentos", controls: ["select", "input", "textarea", "button"] },
  { name: "Pedidos de Venda", controls: ["select", "button"] },
] as const;

function control(tag: string, testId: string, key: string) {
  if (tag === "select") {
    return h("select", { "data-testid": testId, defaultValue: "", key }, [
      h("option", { key: "empty", value: "" }, "Selecione"),
      h("option", { key: "value", value: "value" }, "Valor"),
    ]);
  }

  return h(tag, { "data-testid": testId, key, type: tag === "input" ? "text" : undefined });
}

describe("cobertura operacional de teclado", () => {
  it.each(moduleCases)("mantém a sequência de foco no módulo %s", async ({ name, controls }) => {
    const view = render(
      h(KeyboardNavigator, null, h("section", { "data-keyboard-scope": name },
        controls.map((tag, index) => control(tag, `${name}-${index}`, `${name}-${index}`)),
      )),
    );

    const first = view.getByTestId(`${name}-0`);
    const second = view.getByTestId(`${name}-1`);

    first.focus();
    fireEvent.keyDown(first, { key: "Enter" });

    if (first instanceof HTMLSelectElement) {
      fireEvent.change(first, { target: { value: "value" } });
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }

    if (second instanceof HTMLButtonElement) {
      expect(document.activeElement).toBe(first);
      return;
    }

    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(first);
  });

  it("preserva Enter em observações de fornecedores e orçamentos", () => {
    for (const name of ["Fornecedores", "Orçamentos"]) {
      const view = render(
        h(KeyboardNavigator, null, h("section", { "data-keyboard-scope": name },
          h("textarea", { "data-testid": `${name}-notes` }),
          h("button", { "data-testid": `${name}-save` }, "Salvar"),
        )),
      );
      const notes = view.getByTestId(`${name}-notes`);
      notes.focus();
      fireEvent.keyDown(notes, { key: "Enter" });
      expect(document.activeElement).toBe(notes);
      cleanup();
    }
  });
});
