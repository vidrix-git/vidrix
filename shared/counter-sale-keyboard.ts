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
