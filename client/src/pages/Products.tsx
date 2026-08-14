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
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toProductMutationInput, type ProductCatalogForm } from "@shared/product-contract";

export default function Products() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductCatalogForm>({
    name: "", type: "", thickness: "", color: "",
    unitPrice: "0", stockQuantity: 0, minStockQuantity: 10,
  });

  const { data: products, isLoading } = trpc.products.list.useQuery();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDialogOpen(false);
      toast.success("Produto cadastrado com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDialogOpen(false);
      setEditId(null);
      toast.success("Produto atualizado com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDeleteId(null);
      toast.success("Produto excluído com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const input = toProductMutationInput(form);
    if (editId) {
      updateMutation.mutate({ id: editId, ...input });
    } else {
      createMutation.mutate(input);
    }
  };

  const openEdit = (product: any) => {
    setEditId(product.id);
    setForm({
      name: product.name || "",
      type: product.type || "",
      thickness: product.thickness || "",
      color: product.color || "",
      unitPrice: String(product.unitPrice),
      stockQuantity: Number(product.stockQuantity ?? 0),
      minStockQuantity: Number(product.minStockQuantity ?? 0),
    });
    setDialogOpen(true);
  };

  const filtered = products?.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getStockBadge = (p: any) => {
    if (p.stockQuantity === 0) return <Badge variant="destructive">Esgotado</Badge>;
    if (p.stockQuantity <= p.minStockQuantity) return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Crítico</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus produtos e vidros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Vidro incolor 4mm" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={form.type || "none"} onValueChange={(v) => setForm({ ...form, type: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      <SelectItem value="vidro_incolor">Vidro Incolor</SelectItem>
                      <SelectItem value="vidro_fumace">Vidro Fumacê</SelectItem>
                      <SelectItem value="vidro_verde">Vidro Verde</SelectItem>
                      <SelectItem value="vidro_espelhado">Vidro Espelhado</SelectItem>
                      <SelectItem value="vidro_temperado">Vidro Temperado</SelectItem>
                      <SelectItem value="vidro_laminado">Vidro Laminado</SelectItem>
                      <SelectItem value="acrilico">Acrílico</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Espessura (mm)</label>
                  <Input value={form.thickness || ""} onChange={(e) => setForm({ ...form, thickness: e.target.value })} placeholder="4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Incolor" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Unitário (R$/m²) *</label>
                <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estoque Atual</label>
                  <Input type="number" value={String(form.stockQuantity)} onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estoque Mínimo</label>
                  <Input type="number" value={String(form.minStockQuantity)} onChange={(e) => setForm({ ...form, minStockQuantity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Espessura</TableHead>
                  <TableHead>Preço/m²</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.type || "-"}</TableCell>
                    <TableCell>{product.thickness || "-"}</TableCell>
                    <TableCell>R$ {parseFloat(String(product.unitPrice)).toFixed(2)}</TableCell>
                    <TableCell>{product.stockQuantity} un</TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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
