import React, { type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";

const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  '[role="combobox"]:not([aria-disabled="true"])',
  "[data-enter-target]:not([disabled])",
].join(",");

function canMoveWithEnter(target: HTMLElement) {
  if (target instanceof HTMLTextAreaElement) return false;
  // Um botão marcado entra na sequência de foco, mas o Enter nele deve acionar
  // sua ação nativa, e não ser convertido em mais um avanço.
  if (target instanceof HTMLButtonElement) return false;
  if (target instanceof HTMLInputElement) return true;
  return target.matches("[data-enter-target]");
}

function isVisibleKeyboardTarget(field: HTMLElement) {
  if (field.hasAttribute("aria-hidden") || field.hidden) return false;
  const style = window.getComputedStyle(field);
  return style.display !== "none" && style.visibility !== "hidden";
}

function moveFocus(target: HTMLElement, backwards = false) {
  const root = target.closest<HTMLElement>("[data-keyboard-scope], [role='dialog']") ?? document.body;
  const fields = Array.from(root.querySelectorAll<HTMLElement>(FIELD_SELECTOR))
    .filter(isVisibleKeyboardTarget);
  const currentIndex = fields.indexOf(target);
  const next = fields[backwards ? currentIndex - 1 : currentIndex + 1];
  if (currentIndex >= 0 && next) next.focus();
}

/**
 * Dá aos formulários uma sequência de operação por teclado. Enter avança e
 * Shift+Enter retorna; textareas preservam Enter para quebra de linha.
 */
export function KeyboardNavigator({ children }: { children: ReactNode }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target as HTMLElement;
    if (target instanceof HTMLSelectElement) {
      if (event.shiftKey) {
        event.preventDefault();
        moveFocus(target, true);
      } else {
        target.dataset.keyboardSelection = "true";
      }
      return;
    }
    if (!canMoveWithEnter(target)) return;

    event.preventDefault();
    moveFocus(target, event.shiftKey);
  };

  const handleChange = (event: ChangeEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    if (target.dataset.keyboardSelection === "true") {
      delete target.dataset.keyboardSelection;
      window.setTimeout(() => {
        if (target === document.activeElement) moveFocus(target);
      }, 0);
      return;
    }

    if (target.getAttribute("aria-hidden") !== "true") return;

    window.setTimeout(() => {
      const trigger = target.parentElement?.querySelector<HTMLElement>('[role="combobox"]');
      if (trigger && trigger === document.activeElement) moveFocus(trigger);
    }, 0);
  };

  return <div onKeyDown={handleKeyDown} onChange={handleChange}>{children}</div>;
}
