import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const kanbanColumns = ["aprovado", "em_producao", "pronto", "entregue", "cancelado"];
const statusLabels: Record<string, string> = {
  "aprovado": "Aprovado",
  "em_producao": "Em Produção",
  "pronto": "Pronto",
  "entregue": "Entregue",
  "cancelado": "Cancelado",
};
const statusColors: Record<string, string> = {
  "aprovado": "bg-green-100 text-green-800 border-green-200",
  "em_producao": "bg-blue-100 text-blue-800 border-blue-200",
  "pronto": "bg-amber-100 text-amber-800 border-amber-200",
  "entregue": "bg-gray-100 text-gray-800 border-gray-200",
  "cancelado": "bg-red-100 text-red-800 border-red-200",
};

export default function Orders() {
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<number | null>(null);

  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.orders.delete.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      setDeleteId(null);
      toast.success("Pedido excluído");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDragOrder(orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragOrder) {
      updateStatusMutation.mutate({ id: dragOrder, status: status as any });
    }
    setDragOrder(null);
  };

  const formatCurrency = (value: string | number) =>
    `R$ ${parseFloat(String(value)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos de Venda</h1>
          <p className="text-sm text-muted-foreground">Gerencie pedidos e acompanhe o fluxo</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : !orders || orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum pedido cadastrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => {
                    const client = clients?.find((c: any) => c.id === order.clientId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{client?.name || "-"}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(v) => updateStatusMutation.mutate({ id: order.id, status: v as any })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <Badge className={statusColors[order.status] || ""}>{statusLabels[order.status]}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {kanbanColumns.map(s => (
                                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-5 gap-4">
          {kanbanColumns.map(status => {
            const statusOrders = orders?.filter((o: any) => o.status === status) || [];
            return (
              <div
                key={status}
                className="min-h-[400px] rounded-lg bg-secondary/30 p-3 border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">{statusLabels[status]}</h3>
                  <Badge variant="secondary">{statusOrders.length}</Badge>
                </div>
                <div className="space-y-2">
                  {statusOrders.map((order: any) => {
                    const client = clients?.find((c: any) => c.id === order.clientId);
                    return (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        className="bg-card p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">#{order.id}</span>
                          <Badge className={statusColors[order.status]} variant="outline">{statusLabels[order.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{client?.name || "Cliente"}</p>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    );
                  })}
                  {statusOrders.length === 0 && (
                    <div className="h-20 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">Arraste aqui</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Se o pedido estava ativo, o estoque será restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
