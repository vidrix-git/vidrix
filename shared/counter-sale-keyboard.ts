export type CounterPriceKeyEvent = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

/**
 * O Enter simples no preço encerra a edição do item e pede o próximo passo.
 * Atalhos modificados e Shift+Enter permanecem disponíveis para a navegação
 * global de retorno entre campos.
 */
export function shouldOpenCounterPriceDecision(event: CounterPriceKeyEvent) {
  return event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

/** Confirma a ação já destacada no diálogo de próximo passo. */
export function shouldConfirmCounterPriceDecision(event: CounterPriceKeyEvent) {
  return event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export type CounterPriceDecision = "add" | "finish";

/** Alterna as duas ações do diálogo sem depender da posição visual do botão. */
export function moveCounterPriceDecision(current: CounterPriceDecision, key: string): CounterPriceDecision {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return current;
  return current === "add" ? "finish" : "add";
}

export type CounterSaleOutcome = "quote" | "sale";

/** Move pelo seletor horizontal de orçamento e venda, respeitando a direção solicitada. */
export function moveCounterSaleOutcomeFocus(current: CounterSaleOutcome, key: string): CounterSaleOutcome {
  if (key === "ArrowLeft" && current === "sale") return "quote";
  if (key === "ArrowRight" && current === "quote") return "sale";
  return current;
}

/** Confirma o resultado comercial que está com foco no seletor horizontal. */
export function shouldConfirmCounterSaleOutcome(event: CounterPriceKeyEvent) {
  return event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
