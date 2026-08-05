import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useState } from "react";

export default function Stock() {
  const [typeFilter, setTypeFilter] = useState("");
  const { data: products } = trpc.products.list.useQuery({});
  const { data, isLoading } = trpc.stock.list.useQuery({
    type: typeFilter || undefined,
    limit: 100,
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
          <p className="text-sm text-muted-foreground">Histórico de entradas e saídas de estoque</p>
        </div>

        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Visão Geral do Estoque</h2>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => {
                    const isCritical = parseFloat(product.stockQuantity) <= parseFloat(product.minStock);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell className="font-semibold">{product.stockQuantity}</TableCell>
                        <TableCell>{product.minStock}</TableCell>
                        <TableCell>
                          {isCritical ? (
                            <Badge variant="destructive">Crítico</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Movements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Histórico de Movimentações</h2>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="in">Entradas</SelectItem>
                  <SelectItem value="out">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma movimentação registrada</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((movement: any) => {
                    const prod = products?.find((p: any) => p.id === movement.productId);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <Badge className={movement.type === "in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {movement.type === "in" ? <ArrowDownToLine className="mr-1 h-3 w-3" /> : <ArrowUpFromLine className="mr-1 h-3 w-3" />}
                            {movement.type === "in" ? "Entrada" : "Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{prod?.name || "-"}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{movement.referenceType || "-"}</TableCell>
                        <TableCell>{new Date(movement.createdAt).toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
