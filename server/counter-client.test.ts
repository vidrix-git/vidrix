import { describe, expect, it } from "vitest";
import { applyQuickClientCompletion, quickClientCompletion } from "../shared/counter-client";

describe("cadastro rápido de cliente no balcão", () => {
  it("seleciona o novo cliente, limpa a busca e retorna à escolha de cliente", () => {
    expect(quickClientCompletion(57)).toEqual({
      clientId: "57",
      clientSearch: "",
      showQuickClient: false,
    });
  });

  it("aplica o retorno do cadastro rápido aos setters usados no encerramento", () => {
    const calls = { clientId: "", clientSearch: "pendente", showQuickClient: true };

    const result = applyQuickClientCompletion(57, {
      setClientId: (value) => { calls.clientId = value; },
      setClientSearch: (value) => { calls.clientSearch = value; },
      setShowQuickClient: (value) => { calls.showQuickClient = value; },
    });

    expect(result).toEqual({ clientId: "57", clientSearch: "", showQuickClient: false });
    expect(calls).toEqual({ clientId: "57", clientSearch: "", showQuickClient: false });
  });
});
