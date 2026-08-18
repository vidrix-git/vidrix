import * as React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  moveCounterPriceDecision,
  shouldConfirmCounterPriceDecision,
  type CounterPriceDecision,
} from "../../../shared/counter-sale-keyboard";

type CounterPriceDecisionButtonsProps = {
  decision: CounterPriceDecision;
  onDecisionChange: (decision: CounterPriceDecision) => void;
  onAddProduct: () => void;
  onFinish: () => void;
};

/**
 * Ações do diálogo de próximo passo do Balcão.
 * O foco é movido no próprio evento de seta, em vez de depender apenas do
 * ciclo de renderização, para manter a resposta imediata durante a operação.
 */
export function CounterPriceDecisionButtons({
  decision,
  onDecisionChange,
  onAddProduct,
  onFinish,
}: CounterPriceDecisionButtonsProps) {
  const addProductRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

  const focusDecision = (nextDecision: CounterPriceDecision) => {
    onDecisionChange(nextDecision);
    (nextDecision === "add" ? addProductRef : finishRef).current?.focus();
  };

  useEffect(() => {
    (decision === "add" ? addProductRef : finishRef).current?.focus();
  }, [decision]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (shouldConfirmCounterPriceDecision(event)) {
      event.preventDefault();
      event.stopPropagation();
      if (decision === "add") onAddProduct();
      else onFinish();
      return;
    }

    const nextDecision = moveCounterPriceDecision(decision, event.key);
    if (nextDecision === decision) return;
    event.preventDefault();
    event.stopPropagation();
    focusDecision(nextDecision);
  };

  return <>
    <Button ref={addProductRef} type="button" variant="outline" onFocus={() => onDecisionChange("add")} onKeyDown={handleKeyDown} onClick={onAddProduct}>Adicionar novo produto</Button>
    <Button ref={finishRef} type="button" onFocus={() => onDecisionChange("finish")} onKeyDown={handleKeyDown} onClick={onFinish}>Finalizar atendimento</Button>
  </>;
}
