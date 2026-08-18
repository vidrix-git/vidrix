// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createElement, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CounterPriceDecisionButtons } from "../client/src/components/CounterPriceDecisionButtons";
import type { CounterPriceDecision } from "../shared/counter-sale-keyboard";

const h = createElement;

afterEach(() => cleanup());

function DecisionHarness() {
  const [decision, setDecision] = useState<CounterPriceDecision>("finish");
  return h("div", { role: "dialog" }, h(CounterPriceDecisionButtons, {
    decision,
    onDecisionChange: setDecision,
    onAddProduct: () => undefined,
    onFinish: () => undefined,
  }));
}

describe("CounterPriceDecisionButtons — comportamento de foco", () => {
  it("move o foco real entre as ações do diálogo com as setas esquerda e direita", () => {
    const view = render(h(DecisionHarness));
    const add = view.getByRole("button", { name: "Adicionar novo produto" });
    const finish = view.getByRole("button", { name: "Finalizar atendimento" });

    finish.focus();
    fireEvent.keyDown(finish, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(add);

    fireEvent.keyDown(add, { key: "ArrowRight" });
    expect(document.activeElement).toBe(finish);
  });

  it("usa o botão realmente focado como origem mesmo se o estado de decisão estiver atrasado", () => {
    const view = render(h(CounterPriceDecisionButtons, {
      decision: "finish",
      onDecisionChange: () => undefined,
      onAddProduct: () => undefined,
      onFinish: () => undefined,
    }));
    const add = view.getByRole("button", { name: "Adicionar novo produto" });
    const finish = view.getByRole("button", { name: "Finalizar atendimento" });

    add.focus();
    fireEvent.keyDown(add, { key: "ArrowRight" });

    expect(document.activeElement).toBe(finish);
  });
});
