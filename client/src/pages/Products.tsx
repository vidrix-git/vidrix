import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ProductForm({ product, onSuccess }: { product?: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto cadastrado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto atualizado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [description, setDescription] = useState(product?.description || "");
  const [unitPrice, setUnitPrice] = useState(product?.unitPrice || "0.00");
  const [unit, setUnit] = useState(product?.unit || "un");
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity || "0");
  const [minStock, setMinStock] = useState(product?.minStock || "0");
  const [active, setActive] = useState(product?.active !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    const data = { name, category, description, unitPrice, unit, stockQuantity, minStock, active };
    if (product) {
      updateMutation.mutate({ id: product.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Vidro">Vidro</SelectItem>
              <SelectItem value="Persiana">Persiana</SelectItem>
              <SelectItem value="Espelho">Espelho</SelectItem>
              <SelectItem value="Box">Box para Banheiro</SelectItem>
              <SelectItem value="Moldura">Moldura</SelectItem>
              <SelectItem value="Ferragem">Ferragem</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Unidade</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="un">Unidade</SelectItem>
              <SelectItem value="m2">m²</SelectItem>
              <SelectItem value="ml">Metro Linear</SelectItem>
              <SelectItem value="kg">Quilograma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preço Unitário (R$)</Label>
          <Input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </div>
        <div>
          <Label>Estoque Atual</Label>
          <Input type="text" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
        </div>
        <div>
          <Label>Estoque Mínimo</Label>
          <Input type="text" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Ativo</Label>
        </div>
        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>
      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
        {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto removido!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data, isLoading } = trpc.products.list.useQuery({ search: search || undefined });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="text-sm text-muted-foreground">Cadastro de produtos com controle de estoque</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingProduct(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              </DialogHeader>
              <ProductForm product={editingProduct} onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((product: any) => {
                    const isCritical = parseFloat(product.stockQuantity) <= parseFloat(product.minStock);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>R$ {parseFloat(product.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell className={isCritical ? "text-red-600 font-semibold" : ""}>
                          {isCritical && <AlertTriangle className="inline h-3 w-3 mr-1 text-red-500" />}
                          {product.stockQuantity}
                        </TableCell>
                        <TableCell>{product.minStock}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {product.active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {user?.role === "admin" && (
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: product.id })}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
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
      </div>
    </DashboardLayout>
  );
}
