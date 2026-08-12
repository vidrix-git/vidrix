import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  FileText,
  TrendingUp,
  Package,
} from "lucide-react";

const COLORS = ["#059669", "#2563eb", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function Dashboard() {
  const [period, setPeriod] = useState("30d");
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery({ period: period as any });
  const { data: revenueData } = trpc.dashboard.revenueByMonth.useQuery({ months: 6 });
  const { data: commissions } = trpc.dashboard.commissions.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-10 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const ordersByStatusData = stats
    ? Object.entries(stats.ordersByStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do desempenho comercial
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats?.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl font-bold text-foreground">{stats?.criticalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orçamentos Ativos</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Pedidos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersByStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ordersByStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Nenhum pedido registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commissions & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Comissões por Vendedor
            </CardTitle>
            <CardDescription>5% sobre vendas entregues</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{c.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Vendas: R$ {c.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      R$ {c.commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma comissão registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>Produtos abaixo do mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium text-sm">Esgotados</p>
                  <p className="text-xs text-muted-foreground">Sem estoque</p>
                </div>
                <Badge variant="destructive">{stats?.outOfStock}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <div>
                  <p className="font-medium text-sm">Críticos</p>
                  <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
                </div>
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  {stats?.criticalStock}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">Reposição necessária</p>
                  <p className="text-xs text-muted-foreground">Abaixo de 2x o mínimo</p>
                </div>
                <Badge variant="secondary">{stats?.pendingPurchases}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
