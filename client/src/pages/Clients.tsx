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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, CircleAlert, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toClientMutationInput } from "../../../shared/client-contract";
import { clientDocumentError, formatClientDocument, formatPhone, formatZipCode, isValidClientDocument, isValidZipCode } from "../../../shared/client-identifiers";

type ClientForm = {
  name: string;
  type: "PF" | "PJ";
  cpfCnpj: string;
  email?: string | null;
  phone?: string | null;
  whatsApp?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

type FormStatus = { kind: "success" | "error" | "info"; message: string } | null;

export default function Clients() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const emptyForm: ClientForm = { name: "", type: "PF", cpfCnpj: "", email: "", phone: "", whatsApp: "", address: "", addressNumber: "", addressComplement: "", neighborhood: "", city: "", state: "", zipCode: "" };
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);

  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setFormStatus({ kind: "success", message: "Cliente cadastrado com sucesso." });
      toast.success("Cliente cadastrado com sucesso");
      window.setTimeout(() => { setDialogOpen(false); setForm(emptyForm); setFormStatus(null); }, 2500);
    },
    onError: (e) => { setFormStatus({ kind: "error", message: e.message }); toast.error(e.message); },
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setFormStatus({ kind: "success", message: "Cliente atualizado com sucesso." });
      toast.success("Cliente atualizado com sucesso");
      window.setTimeout(() => { setDialogOpen(false); setEditId(null); setForm(emptyForm); setFormStatus(null); }, 2500);
    },
    onError: (e) => { setFormStatus({ kind: "error", message: e.message }); toast.error(e.message); },
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDeleteId(null);
      toast.success("Cliente excluído com sucesso");
    },
    onError: (e) => toast.error(e.message),
  });
  const cepMutation = trpc.clients.lookupCep.useMutation({
    onSuccess: (address) => {
      setForm((current) => ({
        ...current,
        zipCode: address.zipCode,
        address: address.address || current.address,
        neighborhood: address.neighborhood || current.neighborhood,
        city: address.city || current.city,
        state: address.state || current.state,
      }));
      setFormStatus({ kind: "success", message: "CEP encontrado. Endereço preenchido; revise o número e complemente se necessário." });
      toast.success("CEP encontrado e endereço preenchido");
    },
    onError: (e) => { setFormStatus({ kind: "error", message: e.message }); toast.error(e.message); },
  });

  const setError = (message: string) => {
    setFormStatus({ kind: "error", message });
    toast.error(message);
  };

  const handleCepLookup = () => {
    if (!isValidZipCode(form.zipCode)) {
      setError("Informe um CEP com 8 dígitos para consultar o endereço");
      return;
    }
    setFormStatus({ kind: "info", message: "Consultando CEP..." });
    cepMutation.mutate({ zipCode: form.zipCode || "" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!form.cpfCnpj.trim()) {
      setError("CPF/CNPJ é obrigatório");
      return;
    }
    if (!isValidClientDocument(form.cpfCnpj, form.type)) {
      setError(clientDocumentError(form.type));
      return;
    }
    setFormStatus({ kind: "info", message: editId ? "Atualizando cliente..." : "Cadastrando cliente..." });
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
      whatsApp: client.whatsApp || "",
      address: client.address || "",
      addressNumber: client.addressNumber || "",
      addressComplement: client.addressComplement || "",
      neighborhood: client.neighborhood || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditId(null); setForm(emptyForm); setFormStatus(null); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {formStatus && (
                <Alert variant={formStatus.kind === "error" ? "destructive" : "default"} className={formStatus.kind === "success" ? "border-emerald-500/40 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50" : ""}>
                  {formStatus.kind === "success" ? <CheckCircle2 className="h-4 w-4" /> : formStatus.kind === "info" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleAlert className="h-4 w-4" />}
                  <AlertTitle>{formStatus.kind === "success" ? "Concluído" : formStatus.kind === "info" ? "Aguarde" : "Atenção"}</AlertTitle>
                  <AlertDescription>{formStatus.message}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value as "PF" | "PJ";
                      setForm({ ...form, type, cpfCnpj: formatClientDocument(form.cpfCnpj, type) });
                    }}
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
                    onChange={(e) => setForm({ ...form, cpfCnpj: formatClientDocument(e.target.value, form.type) })}
                    placeholder={form.type === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                    inputMode="numeric"
                    maxLength={form.type === "PJ" ? 18 : 14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp</label>
                <Input value={form.whatsApp || ""} onChange={(e) => setForm({ ...form, whatsApp: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} />
              </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">CEP</label>
                  <div className="flex gap-2">
                    <Input value={form.zipCode || ""} onChange={(e) => setForm({ ...form, zipCode: formatZipCode(e.target.value) })} onBlur={handleCepLookup} placeholder="00000-000" inputMode="numeric" maxLength={9} />
                    <Button type="button" variant="outline" onClick={handleCepLookup} disabled={cepMutation.isPending} aria-label="Consultar CEP">
                      {cepMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      <span className="hidden sm:inline">Buscar</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">UF</label>
                  <Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logradouro</label>
                <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, avenida ou estrada" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número</label>
                  <Input value={form.addressNumber || ""} onChange={(e) => setForm({ ...form, addressNumber: e.target.value })} placeholder="123" maxLength={32} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Complemento</label>
                  <Input value={form.addressComplement || ""} onChange={(e) => setForm({ ...form, addressComplement: e.target.value })} placeholder="Sala, apartamento, bloco etc." maxLength={255} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bairro</label>
                <Input value={form.neighborhood || ""} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Bairro" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setDialogOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>Cancelar</Button>
              <Button data-enter-target className="w-full sm:w-auto" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || cepMutation.isPending}>
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
                  <TableHead>WhatsApp</TableHead>
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
                    <TableCell>{client.whatsApp || "-"}</TableCell>
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
