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
    expect(counter).toContain('setOutcome("quote")');
    expect(counter).toContain('setOutcome("sale")');
    expect(counter).toContain('{outcome && <Card');
    expect(counter).toContain('Cadastrar e selecionar cliente');
    expect(counter).toContain('placeholder="Buscar por nome, CPF/CNPJ, telefone ou WhatsApp"');
    expect(counter).toContain('const matchingClients = useMemo');
    expect(counter).toContain('applyQuickClientCompletion(result.insertId, { setClientId, setClientSearch, setShowQuickClient })');
    expect(counter).toContain('setQuickClient(emptyQuickClient)');
    expect(counter).toContain('trpc.counterSales.finalize.useMutation');
    expect(counter).toContain('acessorio: "Acessório"');
    expect(counter).toContain('montagem: "Montagem"');
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
});
