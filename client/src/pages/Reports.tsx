import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, TrendingUp, Package, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }
  const keys = Object.keys(data[0]);
  const header = keys.join(";");
  const rows = data.map((row: any) => keys.map((k) => `"${row[k]}"`).join(";"));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Arquivo ${filename} exportado!`);
}

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: revenueData, isLoading: revenueLoading } = trpc.reports.revenue.useQuery({ startDate, endDate });
  const { data: criticalStock, isLoading: stockLoading } = trpc.reports.criticalStock.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 200 });

  const totalRevenue = revenueData?.reduce((sum: number, r: any) => sum + parseFloat(r.total), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Exporte dados do sistema em formato CSV</p>
        </div>

        {/* Revenue Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Faturamento
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(
                  revenueData?.map((r: any) => ({
                    data: r.date,
                    faturamento: parseFloat(r.total).toFixed(2),
                    pedidos: r.count,
                  })) || [],
                  `faturamento_${startDate}_${endDate}.csv`
                )}
                disabled={!revenueData || revenueData.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>
            <div className="flex gap-3 items-end mt-3">
              <div>
                <Label>Data Inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Faturamento total no período ({revenueData?.length || 0} dias com vendas)</p>
            </div>
            {revenueLoading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : !revenueData || revenueData.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">Nenhuma venda no período</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{r.date ? new Date(r.date).toLocaleDateString('pt-BR') : "-"}</TableCell>
                      <TableCell className="font-semibold">R$ {parseFloat(r.total).toFixed(2)}</TableCell>
                      <TableCell>{r.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Stock Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Análise de Estoque
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(
                  (products || []).map((p: any) => ({
                    nome: p.name,
                    categoria: p.category || "",
                    estoque_atual: p.stockQuantity,
                    estoque_minimo: p.minStock,
                    status: parseFloat(p.stockQuantity) <= parseFloat(p.minStock) ? "CRÍTICO" : "OK",
                    preco_unitario: parseFloat(p.unitPrice).toFixed(2),
                  })),
                  `estoque_${new Date().toISOString().split("T")[0]}.csv`
                )}
                disabled={!products || products.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stockLoading || productsLoading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : !products || products.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">Nenhum produto cadastrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => {
                    const isCritical = parseFloat(p.stockQuantity) <= parseFloat(p.minStock);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category || "-"}</TableCell>
                        <TableCell>{p.stockQuantity}</TableCell>
                        <TableCell>{p.minStock}</TableCell>
                        <TableCell>
                          <Badge variant={isCritical ? "destructive" : "outline"}>{isCritical ? "Crítico" : "OK"}</Badge>
                        </TableCell>
                        <TableCell>R$ {parseFloat(p.unitPrice).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Commissions Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Comissões (estimativa)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ordersByUser = [
                    { usuario: "Administrador", total_pedidos: revenueData?.length || 0, faturamento: totalRevenue.toFixed(2), comissao_10: (totalRevenue * 0.10).toFixed(2), comissao_5: (totalRevenue * 0.05).toFixed(2) }
                  ];
                  downloadCSV(ordersByUser, `comissoes_${startDate}_${endDate}.csv`);
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead>Comissão 5%</TableHead>
                  <TableHead>Comissão 10%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Vendedores</TableCell>
                  <TableCell>R$ {totalRevenue.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">R$ {(totalRevenue * 0.05).toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">R$ {(totalRevenue * 0.10).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-2">* Estimativa baseada em taxa de comissão padrão. Ajuste conforme política da empresa.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
