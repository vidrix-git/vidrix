import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, PackageCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const poStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const poStatusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  received: "Recebido",
  cancelled: "Cancelado",
};

interface POItem {
  productId: number;
  quantity: string;
  unitPrice: string;
}

function POForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: products } = trpc.products.list.useQuery({});

  const createMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => { utils.purchaseOrders.list.invalidate(); toast.success("Pedido de compra criado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([{ productId: 0, quantity: "0", unitPrice: "0" }]);

  const addItem = () => setItems([...items, { productId: 0, quantity: "0", unitPrice: "0" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof POItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { toast.error("Selecione um fornecedor"); return; }
    createMutation.mutate({
      supplierId: parseInt(supplierId),
      notes,
      items: items.map((item) => ({ ...item, productId: parseInt(item.productId.toString()) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Fornecedor *</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {suppliers?.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Itens</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-slate-50">
              <div className="col-span-5">
                <Label className="text-xs">Produto</Label>
                <Select value={item.productId.toString()} onValueChange={(v) => updateItem(index, "productId", v)}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    {products?.filter((p: any) => p.active !== false).map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Quantidade</Label>
                <Input type="text" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Preço Unit.</Label>
                <Input value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} />
              </div>
              <div className="col-span-1 flex items-end justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-right mt-2"><span className="font-bold">Total: R$ {totalValue.toFixed(2)}</span></div>
      </div>

      <Button type="submit" disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending ? "Criando..." : "Criar Pedido de Compra"}
      </Button>
    </form>
  );
}

export default function PurchaseOrders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const receiveMutation = trpc.purchaseOrders.receive.useMutation({
    onSuccess: () => { utils.purchaseOrders.list.invalidate(); utils.products.list.invalidate(); toast.success("Pedido recebido! Estoque atualizado."); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.purchaseOrders.delete.useMutation({
    onSuccess: () => { utils.purchaseOrders.list.invalidate(); toast.success("Pedido removido!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data, isLoading } = trpc.purchaseOrders.list.useQuery({ status: statusFilter || undefined });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pedidos de Compra</h1>
            <p className="text-sm text-muted-foreground">Pedidos de compra a fornecedores com recebimento automático</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo Pedido de Compra</DialogTitle></DialogHeader>
              <POForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum pedido de compra encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.number}</TableCell>
                      <TableCell>{po.supplierName || "-"}</TableCell>
                      <TableCell>R$ {parseFloat(po.totalValue).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={poStatusColors[po.status]}>{poStatusLabels[po.status]}</Badge>
                      </TableCell>
                      <TableCell>{new Date(po.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {po.status === "pending" && user?.role === "admin" && (
                            <Button variant="ghost" size="sm" onClick={() => receiveMutation.mutate({ id: po.id })}>
                              <PackageCheck className="mr-1 h-4 w-4 text-green-600" /> Receber
                            </Button>
                          )}
                          {user?.role === "admin" && po.status === "pending" && (
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: po.id })}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
