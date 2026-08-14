import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("..", import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

describe("contratos operacionais da interface", () => {
  it("mantém um atendimento único que escolhe orçamento ou venda somente no encerramento", () => {
    const counter = source("client/src/pages/CounterSale.tsx");

    expect(counter).toContain('useState<"quote" | "sale" | null>(null)');
    expect(counter).toContain('chooseOutcome("quote")');
    expect(counter).toContain('chooseOutcome("sale")');
    expect(counter).toContain('{outcome && <Card');
    expect(counter).toContain('Cadastrar e selecionar cliente');
    expect(counter).toContain('placeholder="Buscar por nome, CPF/CNPJ, telefone ou WhatsApp"');
    expect(counter).toContain('const matchingClients = useMemo');
    expect(counter).toContain('applyQuickClientCompletion(result.insertId, { setClientId, setClientSearch, setShowQuickClient })');
    expect(counter).toContain('setQuickClient(emptyQuickClient)');
    expect(counter).toContain('trpc.counterSales.finalize.useMutation');
    expect(counter).toContain('acessorio: "Acessório"');
    expect(counter).toContain('montagem: "Montagem"');
    expect(counter).toContain("data-keyboard-scope");
    expect(counter).not.toContain('<CardHeader><CardTitle>Atendimento</CardTitle>');
    expect(counter).toContain("Use Enter para avançar pelos campos");
    expect(counter).toContain("shouldOpenCounterPriceDecision(event)");
    expect(counter).toContain("Próximo passo do atendimento");
    expect(counter).toContain("Adicionar novo produto");
    expect(counter).toContain("Finalizar atendimento");
    expect(counter).toContain("setShowPriceDecision(false)");
    expect(counter).toContain("outcomeChoiceRef.current?.focus()");
    expect(counter).toContain("initialProductRef.current?.focus()");
    expect(counter).toContain("moveCounterPriceDecision(priceDecision, event.key)");
    expect(counter).toContain("shouldConfirmCounterPriceDecision(event)");
    expect(counter).toContain("moveCounterSaleOutcomeFocus(currentOutcome, event.key)");
    expect(counter).toContain("outcomeClientSearchRef.current?.focus()");
    expect(counter).toContain("event.stopPropagation()");
    expect(counter).toContain("Use ← e → para alternar e Enter para confirmar");
  });

  it("impede reenvio de recebimento de compra enquanto a transação está pendente", () => {
    const purchases = source("client/src/pages/Purchases.tsx");

    expect(purchases).toContain('if (receiveMutation.isPending) return;');
    expect(purchases).toContain('disabled={receiveMutation.isPending}');
    expect(purchases).toContain('alreadyReceived ? "Este pedido já havia sido recebido');
  });

  it("mantém rótulos completos para as origens de estoque e liga o filtro à receita", () => {
    const stock = source("client/src/pages/Stock.tsx");
    const reports = source("client/src/pages/Reports.tsx");

    for (const label of ["Venda de Balcão", "Recebimento de Compra", "Cancelamento de Pedido", "Ajuste de Pedido", "Remoção de Item"]) {
      expect(stock).toContain(label);
    }
    expect(reports).toContain('const [period, setPeriod] = useState("30d")');
    expect(reports).toContain('const revenuePeriod = useMemo(() => resolveRevenuePeriod(period), [period])');
    expect(reports).toContain('trpc.reports.revenue.useQuery(revenuePeriod)');
  });

  it("agrupa a barra lateral por áreas de trabalho sem perder nenhuma rota operacional", () => {
    const layout = source("client/src/components/DashboardLayout.tsx");

    for (const group of ["Visão geral", "Atendimento comercial", "Cadastros", "Suprimentos e estoque", "Gestão"]) {
      expect(layout).toContain(`label: "${group}"`);
    }
    for (const path of ["/", "/counter-sale", "/quotes", "/orders", "/clients", "/products", "/suppliers", "/purchases", "/stock", "/reports"]) {
      expect(layout).toContain(`path: "${path}"`);
    }
    expect(layout).toContain("menuGroups.flatMap");
    expect(layout).toContain("<SidebarGroup");
    expect(layout).toContain("<SidebarGroupLabel");
  });

  it("mantém infraestrutura de navegação por Enter sem quebrar campos multiline", () => {
    const app = source("client/src/App.tsx");
    const keyboard = source("client/src/components/KeyboardNavigator.tsx");
    const styles = source("client/src/index.css");

    expect(app).toContain("<KeyboardNavigator><Router /></KeyboardNavigator>");
    expect(keyboard).toContain('event.key !== "Enter"');
    expect(keyboard).toContain("backwards ? currentIndex - 1 : currentIndex + 1");
    expect(keyboard).toContain("moveFocus(target, event.shiftKey)");
    expect(keyboard).toContain("target instanceof HTMLTextAreaElement");
    expect(keyboard).toContain("target instanceof HTMLSelectElement");
    expect(keyboard).toContain('target.dataset.keyboardSelection = "true"');
    expect(keyboard).toContain('if (target.dataset.keyboardSelection === "true")');
    expect(keyboard).toContain('[role="combobox"]');
    expect(keyboard).toContain("[data-keyboard-scope], [role='dialog']");
    expect(keyboard).toContain('target.getAttribute("aria-hidden") !== "true"');
    expect(keyboard).toContain("if (trigger && trigger === document.activeElement) moveFocus(trigger)");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("outline: 3px solid var(--ring)");
  });
});
