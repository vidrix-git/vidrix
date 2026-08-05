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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Trash2, Edit2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function SupplierForm({ supplier, onSuccess }: { supplier?: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); toast.success("Fornecedor cadastrado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); toast.success("Fornecedor atualizado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(supplier?.name || "");
  const [cnpj, setCnpj] = useState(supplier?.cnpj || "");
  const [phone, setPhone] = useState(supplier?.phone || "");
  const [email, setEmail] = useState(supplier?.email || "");
  const [address, setAddress] = useState(supplier?.address || "");
  const [contact, setContact] = useState(supplier?.contact || "");
  const [notes, setNotes] = useState(supplier?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    const data = { name, cnpj, phone, email, address, contact, notes };
    if (supplier) {
      updateMutation.mutate({ id: supplier.id, ...data });
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
          <Label>CNPJ</Label>
          <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Contato</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
        {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

function SupplierPrices({ supplier }: { supplier: any }) {
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery({});
  const { data: prices } = trpc.suppliers.prices.list.useQuery({ supplierId: supplier.id });

  const upsertMutation = trpc.suppliers.prices.upsert.useMutation({
    onSuccess: () => { utils.suppliers.prices.list.invalidate({ supplierId: supplier.id }); toast.success("Preço atualizado!"); },
    onError: (err) => toast.error(err.message),
  });

  const [productId, setProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("0");

  const handleAddPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !unitPrice) { toast.error("Selecione produto e preço"); return; }
    upsertMutation.mutate({
      supplierId: supplier.id,
      productId: parseInt(productId),
      unitPrice,
      leadTimeDays: parseInt(leadTimeDays) || 0,
    });
    setProductId("");
    setUnitPrice("");
    setLeadTimeDays("0");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddPrice} className="flex gap-3 items-end flex-wrap">
        <div>
          <Label>Produto</Label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm min-w-[200px]">
            <option value="">Selecione...</option>
            {products?.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Preço (R$)</Label>
          <Input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-32" />
        </div>
        <div>
          <Label>Prazo (dias)</Label>
          <Input type="number" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} className="w-24" />
        </div>
        <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
          <Plus className="mr-1 h-3 w-3" /> Adicionar
        </Button>
      </form>

      {prices && prices.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Preço Unit.</TableHead>
              <TableHead>Prazo (dias)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((price: any) => {
              const prod = products?.find((p: any) => p.id === price.productId);
              return (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{prod?.name || "Produto removido"}</TableCell>
                  <TableCell>R$ {parseFloat(price.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{price.leadTimeDays} dias</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum preço cadastrado</p>
      )}
    </div>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); toast.success("Fornecedor removido!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data, isLoading } = trpc.suppliers.list.useQuery({ search: search || undefined });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fornecedores</h1>
            <p className="text-sm text-muted-foreground">Cadastro de fornecedores e tabela de preços</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingSupplier(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
              </DialogHeader>
              <SupplierForm supplier={editingSupplier} onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((supplier: any) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.cnpj || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.contact || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(supplier)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingSupplier(supplier); setDialogOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {user?.role === "admin" && (
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: supplier.id })}>
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

        {/* Prices Drawer */}
        {selectedSupplier && (
          <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tabela de Preços - {selectedSupplier.name}</DialogTitle>
              </DialogHeader>
              <SupplierPrices supplier={selectedSupplier} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
