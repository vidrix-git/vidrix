import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, ShoppingBag, Truck } from "lucide-react";

const typeLabels: Record<string, string> = {
  "entrada": "Entrada",
  "saida": "Saída",
};

const typeColors: Record<string, string> = {
  "entrada": "bg-green-100 text-green-800",
  "saida": "bg-red-100 text-red-800",
};

const sourceLabels: Record<string, string> = {
  "purchase": "Pedido de Compra",
  "order": "Pedido de Venda",
  "manual": "Manual",
  "conversion": "Conversão de Orçamento",
};

const sourceIcons: Record<string, string> = {
  "purchase": "🛒",
  "order": "📦",
  "manual": "✏️",
  "conversion": "🔄",
};

export default function Stock() {
  const { data: movements, isLoading } = trpc.stockMovements.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  const getProductName = (productId: number) => {
    return products?.find((p: any) => p.id === productId)?.name || "-";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentos de Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Histórico completo de entradas e saídas com rastreabilidade
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !movements || movements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum movimento de estoque registrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((mov: any) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm">
                      {formatDate(mov.movementDate)}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[mov.movementType] || ""}>
                        {mov.movementType === "entrada" ? (
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                        )}
                        {typeLabels[mov.movementType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getProductName(mov.productId)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {mov.movementType === "entrada" ? "+" : "-"}{mov.quantity} un
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mov.reference || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sourceIcons[mov.sourceType] || ""} {sourceLabels[mov.sourceType] || mov.sourceType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
