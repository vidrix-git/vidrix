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
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  "pendente": "Pendente",
  "recebido": "Recebido",
};

export default function Purchases() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activePO, setActivePO] = useState<number | null>(null);
  const [items, setItems] = useState<{ productId: string; quantity: string; unitCost: string }[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: poList, isLoading } = trpc.purchaseOrders.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: itemsData } = trpc.purchaseOrders.getItems.useQuery(
    { id: activePO || 0 },
    { enabled: activePO !== null }
  );

  const createMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: (res: any) => {
      utils.purchaseOrders.list.invalidate();
      toast.success("Pedido de compra criado. Adicione os itens.");
      setActivePO(res.insertId);
    },
    onError: (e) => toast.error(e.message),
  });

  const addItemMutation = trpc.purchaseOrders.addItem.useMutation({
    onSuccess: () => {
      utils.purchaseOrders.getItems.invalidate({ id: activePO || 0 });
      utils.purchaseOrders.list.invalidate();
      toast.success("Item adicionado");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItemMutation = trpc.purchaseOrders.deleteItem.useMutation({
    onSuccess: () => {
      utils.purchaseOrders.getItems.invalidate({ id: activePO || 0 });
      utils.purchaseOrders.list.invalidate();
      toast.success("Item removido");
    },
    onError: (e) => toast.error(e.message),
  });

  const receiveMutation = trpc.purchaseOrders.receive.useMutation({
    onSuccess: () => {
      utils.purchaseOrders.list.invalidate();
      utils.products.list.invalidate();
      utils.stockMovements.list.invalidate();
      toast.success("Mercadoria recebida! Estoque atualizado automaticamente.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.purchaseOrders.delete.useMutation({
    onSuccess: () => {
      utils.purchaseOrders.list.invalidate();
      setDeleteId(null);
      toast.success("Pedido de compra excluído");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreatePO = () => {
    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }
    createMutation.mutate({
      supplierId: parseInt(supplierId),
      notes: notes || null,
      status: "pendente",
    } as any);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: "1", unitCost: "" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmitItems = () => {
    if (!activePO) return;
    const validItems = items.filter(i => i.productId && i.unitCost);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item válido");
      return;
    }
    let pending = validItems.length;
    for (const item of validItems) {
      const product = products?.find((p: any) => p.id === parseInt(item.productId));
      addItemMutation.mutate({
        purchaseOrderId: activePO,
        productId: parseInt(item.productId),
        quantity: item.quantity || "1",
        unitCost: item.unitCost,
      } as any, {
        onSettled: () => {
          pending--;
          if (pending === 0) {
            setItems([]);
            setActivePO(null);
            setDialogOpen(false);
            toast.success("Itens salvos");
          }
        },
      });
    }
  };

  const handleReceive = (poId: number) => {
    if (window.confirm("Confirmar recebimento da mercadoria? O estoque será atualizado automaticamente.")) {
      receiveMutation.mutate({ id: poId });
    }
  };

  const formatCurrency = (value: string | number) =>
    `R$ ${parseFloat(String(value)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos de Compra</h1>
          <p className="text-sm text-muted-foreground">Compras de fornecedores e recebimento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setSupplierId(""); setNotes(""); setItems([]); setActivePO(null); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido de Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Pedido de Compra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fornecedor *</label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas do pedido" />
              </div>

              {/* Items section */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Itens do Pedido</label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-2 p-3 border rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Produto</label>
                      <Select value={item.productId} onValueChange={(v) => updateItem(idx, "productId", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {products?.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-muted-foreground">Qtd</label>
                      <Input value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} placeholder="1" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-muted-foreground">Custo Un. (R$)</label>
                      <Input value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} placeholder="0.00" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                </Button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={activePO ? handleSubmitItems : handleCreatePO}>
                {activePO ? "Salvar Itens" : "Criar Pedido"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !poList || poList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum pedido de compra cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poList.map((po: any) => {
                  const supplier = suppliers?.find((s: any) => s.id === po.supplierId);
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">#{po.id}</TableCell>
                      <TableCell>{supplier?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "recebido" ? "secondary" : "outline"}>
                          {statusLabels[po.status] || po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                      <TableCell>{new Date(po.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {po.status === "pendente" && (
                            <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleReceive(po.id)}>
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setActivePO(po.id)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(po.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Items Detail Dialog */}
      <Dialog open={activePO !== null && !dialogOpen} onOpenChange={(open) => !open && setActivePO(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Itens do Pedido de Compra #{activePO}</DialogTitle>
          </DialogHeader>
          {itemsData && itemsData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo Un.</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsData.map((item: any) => {
                  const product = products?.find((p: any) => p.id === item.productId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{product?.name || "-"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>R$ {parseFloat(String(item.unitCost)).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {parseFloat(String(item.subtotal)).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItemMutation.mutate({ id: item.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum item neste pedido</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido de compra?
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
