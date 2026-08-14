/* @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { KeyboardNavigator } from "../client/src/components/KeyboardNavigator";

const h = createElement;

afterEach(() => cleanup());

function renderNavigator(children: ReturnType<typeof createElement>) {
  return render(h(KeyboardNavigator, null, children));
}

describe("KeyboardNavigator — comportamento", () => {
  it("avança e retorna entre campos de formulário com Enter e Shift+Enter", () => {
    const view = renderNavigator(
      h("div", null,
        h("input", { "data-testid": "first" }),
        h("input", { "data-testid": "second" }),
        h("input", { "data-testid": "third" }),
      ),
    );
    const first = view.getByTestId("first");
    const second = view.getByTestId("second");
    const third = view.getByTestId("third");

    first.focus();
    fireEvent.keyDown(first, { key: "Enter" });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(first);

    third.focus();
    fireEvent.keyDown(third, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it("preserva Enter em campos multiline e não pula para o próximo controle", () => {
    const view = renderNavigator(
      h("div", null,
        h("textarea", { "data-testid": "notes" }),
        h("input", { "data-testid": "next" }),
      ),
    );
    const notes = view.getByTestId("notes");

    notes.focus();
    fireEvent.keyDown(notes, { key: "Enter" });
    expect(document.activeElement).toBe(notes);
  });

  it("avança após uma seleção nativa confirmada por Enter", async () => {
    const view = renderNavigator(
      h("div", null,
        h("select", { "data-testid": "product", defaultValue: "" },
          h("option", { value: "" }, "Selecione"),
          h("option", { value: "glass" }, "Vidro"),
        ),
        h("input", { "data-testid": "width" }),
      ),
    );
    const product = view.getByTestId("product") as HTMLSelectElement;
    const width = view.getByTestId("width");

    product.focus();
    fireEvent.keyDown(product, { key: "Enter" });
    fireEvent.change(product, { target: { value: "glass" } });
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(product.value).toBe("glass");
    expect(document.activeElement).toBe(width);
  });

  it("mantém a sequência de foco dentro de um diálogo", () => {
    const view = renderNavigator(
      h("div", null,
        h("input", { "data-testid": "outside" }),
        h("div", { role: "dialog" },
          h("input", { "data-testid": "dialog-first" }),
          h("input", { "data-testid": "dialog-last" }),
        ),
      ),
    );
    const first = view.getByTestId("dialog-first");
    const last = view.getByTestId("dialog-last");

    first.focus();
    fireEvent.keyDown(first, { key: "Enter" });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: "Enter" });
    expect(document.activeElement).toBe(last);
  });
});
