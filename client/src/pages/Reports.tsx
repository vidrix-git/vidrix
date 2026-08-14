import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, FileSpreadsheet, TrendingUp, Users, Package } from "lucide-react";

function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(";"),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === "string" && val.includes(";")) return `"${val}"`;
      return String(val ?? "");
    }).join(";"))
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success(`Relatório exportado: ${filename}.csv`);
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function resolveRevenuePeriod(period: string) {
  if (period === "all") return undefined;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (period === "7d" ? 6 : period === "90d" ? 89 : 29));
  return { startDate: formatDateInput(start), endDate: formatDateInput(end) };
}

export default function Reports() {
  const [period, setPeriod] = useState("30d");
  const revenuePeriod = useMemo(() => resolveRevenuePeriod(period), [period]);
  const { data: revenueReport } = trpc.reports.revenue.useQuery(revenuePeriod);
  const { data: commissionReport } = trpc.reports.commissions.useQuery();
  const { data: stockReport } = trpc.reports.stockAnalysis.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análises e exportações de dados</p>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">
            <TrendingUp className="h-4 w-4 mr-2" />
            Faturamento
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <Users className="h-4 w-4 mr-2" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Análise de Estoque
          </TabsTrigger>
        </TabsList>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Faturamento por Período</CardTitle>
                <CardDescription>Resumo de vendas entregues</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select aria-label="Período do faturamento" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="all">Todo o período</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => revenueReport && exportToCSV(revenueReport as any[], "faturamento")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueReport && revenueReport.length > 0 ? (
                    (revenueReport as any[]).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {parseFloat(String(order.totalAmount)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Report */}
        <TabsContent value="commissions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Comissões por Vendedor</CardTitle>
                <CardDescription>5% sobre vendas entregues</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => commissionReport && exportToCSV(commissionReport as any[], "comissoes")}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Vendas Entregues</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Comissão (5%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionReport && commissionReport.length > 0 ? (
                    commissionReport.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.userName}</TableCell>
                        <TableCell>{c.deliveredOrders}</TableCell>
                        <TableCell>R$ {c.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-semibold text-green-700">
                          R$ {c.commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Análise de Estoque</CardTitle>
                <CardDescription>Produtos com situação de estoque</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => stockReport && exportToCSV(stockReport as any[], "estoque")}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Ação Recomendada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockReport && stockReport.length > 0 ? (
                    stockReport.map((s: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.productName}</TableCell>
                        <TableCell>{s.currentStock}</TableCell>
                        <TableCell>{s.minStock}</TableCell>
                        <TableCell>
                          {s.status === "esgotado" && <span className="text-red-600 font-medium">Esgotado</span>}
                          {s.status === "critico" && <span className="text-amber-600 font-medium">Crítico</span>}
                          {s.status === "baixo" && <span className="text-blue-600 font-medium">Baixo</span>}
                          {s.status === "normal" && <span className="text-green-600 font-medium">Normal</span>}
                          {s.status === "excedente" && <span className="text-gray-600 font-medium">Excedente</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.recommendedAction}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
