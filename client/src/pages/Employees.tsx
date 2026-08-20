import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CircleUserRound, KeyRound, Pencil, Plus, Search, ShieldCheck, Store, Trash2, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

type EmployeeForm = { name: string; email: string; password: string };
type Employee = { id: number; name?: string | null; email?: string | null; role?: string | null };
type AccessFilter = "all" | "seller";

const emptyForm: EmployeeForm = { name: "", email: "", password: "" };

function employeeAccess(employee: Employee) {
  if (employee.role === "superadmin") return { key: "superadmin", label: "SUPERADMINISTRADOR", description: "Gestão integral de contas e configurações" };
  if (employee.role === "admin") return { key: "admin", label: "ADMINISTRADOR", description: "Operação completa e gestão administrativa" };
  return { key: "seller", label: "VENDEDOR", description: "Balcão, clientes, orçamentos e próprias vendas" };
}

function AccessBadge({ employee }: { employee: Employee }) {
  const access = employeeAccess(employee);
  const style = access.key === "seller"
    ? "border-emerald-600/25 bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/10"
    : "border-primary/25 bg-primary/10 text-primary hover:bg-primary/10";
  return <div className="flex flex-col items-start gap-1"><Badge className={`gap-1 border px-2 py-1 ${style}`}><Store className="h-3.5 w-3.5" />{access.label}</Badge><span className="text-xs text-muted-foreground">{access.description}</span></div>;
}

export default function Employees() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const { data: employees, isLoading, error } = trpc.employees.list.useQuery();
  const employeeRows = (employees ?? []) as Employee[];

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    return employeeRows.filter((employee) => {
      const access = employeeAccess(employee);
      const values = [employee.name, employee.email, access.label, access.description];
      return (!search || values.some((value) => value?.toLocaleLowerCase("pt-BR").includes(search))) && (accessFilter === "all" || access.key === accessFilter);
    });
  }, [accessFilter, employeeRows, query]);

  const reset = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };
  const create = trpc.employees.create.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Vendedor cadastrado"); reset(); }, onError: (error) => toast.error(error.message) });
  const update = trpc.employees.update.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Vendedor atualizado"); reset(); }, onError: (error) => toast.error(error.message) });
  const remove = trpc.employees.delete.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); setDeleteId(null); toast.success("Vendedor removido"); }, onError: (error) => toast.error(error.message) });
  const isSaving = create.isPending || update.isPending;
  const save = () => {
    if (!form.name.trim() || !form.email.trim() || (!editId && !form.password)) { toast.error("Informe nome, e-mail e senha"); return; }
    if (editId) update.mutate({ id: editId, name: form.name, email: form.email, ...(form.password ? { password: form.password } : {}) });
    else create.mutate(form);
  };
  const openEdit = (employee: Employee) => { setEditId(employee.id); setForm({ name: employee.name || "", email: employee.email || "", password: "" }); setDialogOpen(true); };
  const clearFilters = () => { setQuery(""); setAccessFilter("all"); };
  const hasFilters = Boolean(query.trim()) || accessFilter !== "all";

  return <div className="space-y-6">
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><div className="mb-2 flex items-center gap-2 text-primary"><UsersRound className="h-5 w-5" /><span className="text-sm font-semibold">ACESSOS OPERACIONAIS</span></div><h1 className="text-2xl font-bold text-foreground">Vendedores</h1><p className="mt-2 text-sm text-muted-foreground">Cada conta cadastrada recebe o perfil <strong className="text-foreground">Vendedor</strong>, com acesso ao atendimento comercial e sem módulos administrativos.</p></div>
        <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : reset()}>
          <DialogTrigger asChild><Button className="shadow-sm"><Plus className="mr-2 h-4 w-4" />Novo vendedor</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md"><DialogHeader><DialogTitle>{editId ? "Editar vendedor" : "Novo vendedor"}</DialogTitle></DialogHeader><div className="space-y-4 py-3"><div className="rounded-md border border-emerald-600/25 bg-emerald-600/10 p-3 text-sm"><div className="flex items-center gap-2 font-medium text-emerald-900"><ShieldCheck className="h-4 w-4" />Perfil atribuído: Vendedor</div><p className="mt-1 text-emerald-900/80">Acesso a Balcão, Clientes, Orçamentos e às próprias vendas.</p></div><div className="space-y-2"><label htmlFor="employee-name" className="text-sm font-medium">Nome *</label><Input id="employee-name" autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome completo" /></div><div className="space-y-2"><label htmlFor="employee-email" className="text-sm font-medium">E-mail de acesso *</label><Input id="employee-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="vendedor@empresa.com" /></div><div className="space-y-2"><label htmlFor="employee-password" className="text-sm font-medium">{editId ? "Nova senha (opcional)" : "Senha *"}</label><Input id="employee-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editId ? "Deixe em branco para manter" : "Mínimo de 6 caracteres"} /></div><p className="flex items-center gap-2 text-xs text-muted-foreground"><KeyRound className="h-3.5 w-3.5" />Enter avança até Salvar; Shift+Enter retorna.</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button className="w-full sm:w-auto" variant="outline" onClick={reset}>Cancelar</Button><Button data-enter-target className="w-full sm:w-auto" onClick={save} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar vendedor"}</Button></div></DialogContent>
        </Dialog>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vendedores</p><p className="mt-1 text-2xl font-bold">{employeeRows.length}</p></div><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nível atribuído</p><p className="mt-1 text-sm font-semibold">Vendedor</p></div><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Limite de acesso</p><p className="mt-1 text-sm font-semibold">Atendimento comercial</p></div></div>
    </section>
    <Card><CardHeader className="gap-4 border-b"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><CircleUserRound className="h-4 w-4 text-primary" />Lista de vendedores</CardTitle><Badge variant="secondary">Perfil operacional controlado</Badge></div><p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />O indicador verde identifica vendedores autorizados ao atendimento comercial e às próprias vendas.</p><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar vendedores" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" /></div><div className="space-y-1"><label htmlFor="employee-access-filter" className="sr-only">Nível de acesso</label><select id="employee-access-filter" aria-label="Filtrar por nível de acesso" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={accessFilter} onChange={(event) => setAccessFilter(event.target.value as AccessFilter)}><option value="all">Todos os níveis</option><option value="seller">Vendedor</option></select></div>{hasFilters ? <Button variant="outline" className="w-full md:w-auto" onClick={clearFilters}><X className="mr-2 h-4 w-4" />Limpar filtros</Button> : <div className="hidden md:block" />}</div><p className="text-xs text-muted-foreground">Digite para pesquisar. No seletor, Enter confirma o nível; Tab segue para a próxima ação.</p></CardHeader><CardContent className="p-0">{isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : error ? <div className="p-8 text-center text-destructive">{error.message}</div> : !employeeRows.length ? <div className="p-10 text-center"><UsersRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhum vendedor cadastrado</p><p className="mt-1 text-sm text-muted-foreground">Adicione vendedores para controlar os acessos comerciais.</p></div> : !filteredEmployees.length ? <div className="p-10 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhum vendedor encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste o nome, e-mail ou nível de acesso informado.</p><Button className="mt-4" variant="outline" onClick={clearFilters}>Limpar filtros</Button></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>E-mail de acesso</TableHead><TableHead className="min-w-[225px]">Nível de acesso</TableHead><TableHead className="w-[190px] text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredEmployees.map((employee) => <TableRow key={employee.id}><TableCell className="font-medium">{employee.name}</TableCell><TableCell>{employee.email}</TableCell><TableCell><AccessBadge employee={employee} /></TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" aria-label={`Editar ${employee.name}`} onClick={() => openEdit(employee)}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</Button><Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Remover ${employee.name}`} onClick={() => setDeleteId(employee.id)}><Trash2 className="mr-2 h-3.5 w-3.5" />Remover</Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
    <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover vendedor</AlertDialogTitle><AlertDialogDescription>O vendedor não poderá mais entrar no sistema. Esta ação não apaga documentos comerciais já vinculados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate({ id: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover vendedor</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
