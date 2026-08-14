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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toClientMutationInput } from "../../../shared/client-contract";

type ClientForm = {
  name: string;
  type: "PF" | "PJ";
  cpfCnpj: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
};

export default function Clients() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const emptyForm: ClientForm = { name: "", type: "PF", cpfCnpj: "", email: "", phone: "", address: "", city: "" };
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success("Cliente cadastrado com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDeleteId(null);
      toast.success("Cliente excluído com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.cpfCnpj.trim()) {
      toast.error("CPF/CNPJ é obrigatório");
      return;
    }
    const input = toClientMutationInput(form);
    if (editId) {
      updateMutation.mutate({ id: editId, ...input });
    } else {
      createMutation.mutate(input);
    }
  };

  const openEdit = (client: any) => {
    setEditId(client.id);
    setForm({
      name: client.name || "",
      type: client.type === "PJ" ? "PJ" : "PF",
      cpfCnpj: client.cpfCnpj || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
    });
    setDialogOpen(true);
  };

  const filtered = clients?.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "PF" | "PJ" })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="PF">Pessoa física</option>
                    <option value="PJ">Pessoa jurídica</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">{form.type === "PJ" ? "CNPJ" : "CPF"} *</label>
                  <Input
                    value={form.cpfCnpj}
                    onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                    placeholder={form.type === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Endereço</label>
                <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{client.city || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(client.id)}>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
