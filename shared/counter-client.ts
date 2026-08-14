export function quickClientCompletion(insertId: number) {
  return {
    clientId: String(insertId),
    clientSearch: "",
    showQuickClient: false,
  };
}

type QuickClientCompletionSetters = {
  setClientId: (value: string) => void;
  setClientSearch: (value: string) => void;
  setShowQuickClient: (value: boolean) => void;
};

export function applyQuickClientCompletion(insertId: number, setters: QuickClientCompletionSetters) {
  const next = quickClientCompletion(insertId);
  setters.setClientId(next.clientId);
  setters.setClientSearch(next.clientSearch);
  setters.setShowQuickClient(next.showQuickClient);
  return next;
}
