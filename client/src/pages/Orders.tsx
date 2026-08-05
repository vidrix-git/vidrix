import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const orderStatuses = [
  { key: "approved", label: "Aprovado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "production", label: "Produção", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "ready", label: "Pronto", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { key: "delivered", label: "Entregue", color: "bg-green-100 text-green-700 border-green-200" },
  { key: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
];

function OrderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: approvedQuotes } = trpc.quotes.list.useQuery({ status: "approved" });

  const createMutation = trpc.orders.create.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); utils.quotes.list.invalidate(); toast.success("Pedido criado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const [clientId, setClientId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Selecione um cliente"); return; }
    createMutation.mutate({ clientId: parseInt(clientId), quoteId: quoteId ? parseInt(quoteId) : undefined, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {clients?.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Orçamento (opcional)</Label>
          <Select value={quoteId} onValueChange={setQuoteId}>
            <SelectTrigger><SelectValue placeholder="Selecione um orçamento..." /></SelectTrigger>
            <SelectContent>
              {approvedQuotes?.map((q: any) => (
                <SelectItem key={q.id} value={q.id.toString()}>{q.number} - R$ {parseFloat(q.totalValue).toFixed(2)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Criando..." : "Criar Pedido"}
      </Button>
    </form>
  );
}

export default function Orders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const changeStatusMutation = trpc.orders.changeStatus.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Status atualizado!"); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.orders.delete.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Pedido removido!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data, isLoading } = trpc.orders.list.useQuery({});

  const getNextStatus = (current: string) => {
    const idx = orderStatuses.findIndex((s) => s.key === current);
    if (idx >= 0 && idx < orderStatuses.length - 1) {
      // Skip cancelled for next status
      const nextIdx = idx + 1;
      if (orderStatuses[nextIdx]?.key === "cancelled") return undefined;
      return orderStatuses[nextIdx]?.key;
    }
    return undefined;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pedidos de Venda</h1>
            <p className="text-sm text-muted-foreground">Kanban de acompanhamento de pedidos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Pedido de Venda</DialogTitle></DialogHeader>
              <OrderForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !data || data.length === 0 ? (
          <Card><CardContent><p className="text-center py-12 text-muted-foreground">Nenhum pedido encontrado</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {orderStatuses.map((status) => {
              const ordersInStatus = data?.filter((o: any) => o.status === status.key) || [];
              return (
                <div key={status.key} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold">{status.label}</h3>
                    <Badge variant="outline" className="text-xs">{ordersInStatus.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {ordersInStatus.map((order: any) => (
                      <Card key={order.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">{order.number}</span>
                            {user?.role === "admin" && order.status !== "delivered" && order.status !== "cancelled" && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate({ id: order.id })}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div className="font-medium text-sm">{order.clientName || "Cliente"}</div>
                          <div className="text-sm font-semibold text-primary">R$ {parseFloat(order.totalValue).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
                          {getNextStatus(order.status) && user?.role === "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 text-xs"
                              onClick={() => changeStatusMutation.mutate({ id: order.id, status: getNextStatus(order.status) as any })}
                            >
                              <ArrowRight className="mr-1 h-3 w-3" />
                              {orderStatuses.find((s) => s.key === getNextStatus(order.status))?.label}
                            </Button>
                          )}
                          {order.status === "delivered" && (
                            <Badge className={status.color + " w-full text-center"}>{status.label}</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
