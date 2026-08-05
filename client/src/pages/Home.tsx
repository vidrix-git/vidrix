import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, AlertTriangle, Package, TrendingUp, Users } from "lucide-react";

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  production: "Produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo{user?.name ? `, ${user.name}` : ""} — Visão geral do sistema
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando indicadores...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento (30 dias)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pedidos entregues no período</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.ordersByStatus || []).filter((s: any) => s.status !== "delivered" && s.status !== "cancelled").reduce((sum: number, s: any) => sum + s.count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats?.criticalStock?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Produtos abaixo do mínimo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Entregues</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.ordersByStatus?.find((s: any) => s.status === "delivered")?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pedidos entregues</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders by Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Pedidos por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.ordersByStatus?.map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge>{statusLabels[s.status] || s.status}</Badge>
                        </div>
                        <span className="font-semibold text-lg">{s.count}</span>
                      </div>
                    ))}
                    {(!stats?.ordersByStatus || stats.ordersByStatus.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido registrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" /> Estoque Crítico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.criticalStock?.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-red-600">{p.stockQuantity}</span>
                          <span className="text-xs text-muted-foreground"> / mín. {p.minStock}</span>
                        </div>
                      </div>
                    ))}
                    {(!stats?.criticalStock || stats.criticalStock.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto com estoque crítico</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Informações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-muted-foreground">Usuário</p>
                    <p className="font-semibold">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground">{user?.role === "admin" ? "Administrador" : "Vendedor"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-muted-foreground">Fórmula de Metragem</p>
                    <p className="font-mono text-sm font-semibold">largura × altura / 10000 = m²</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-muted-foreground">Status do Sistema</p>
                    <p className="font-semibold text-green-600">Operacional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
