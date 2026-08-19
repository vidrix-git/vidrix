import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

type EmployeeForm = { name: string; email: string; password: string };
const emptyForm: EmployeeForm = { name: "", email: "", password: "" };

export default function Employees() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const { data: employees, isLoading, error } = trpc.employees.list.useQuery();
  const reset = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };
  const create = trpc.employees.create.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Funcionário cadastrado"); reset(); }, onError: (e) => toast.error(e.message) });
  const update = trpc.employees.update.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Funcionário atualizado"); reset(); }, onError: (e) => toast.error(e.message) });
  const remove = trpc.employees.delete.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); setDeleteId(null); toast.success("Funcionário removido"); }, onError: (e) => toast.error(e.message) });
  const save = () => {
    if (!form.name.trim() || !form.email.trim() || (!editId && !form.password)) { toast.error("Informe nome, e-mail e senha"); return; }
    if (editId) update.mutate({ id: editId, name: form.name, email: form.email, ...(form.password ? { password: form.password } : {}) });
    else create.mutate(form);
  };
  const openEdit = (employee: any) => { setEditId(employee.id); setForm({ name: employee.name || "", email: employee.email || "", password: "" }); setDialogOpen(true); };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold text-foreground">Funcionários</h1><p className="text-sm text-muted-foreground">Cadastre vendedores de frente de caixa e gerencie seus acessos.</p></div>
      <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : reset()}>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo funcionário</Button></DialogTrigger>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md"><DialogHeader><DialogTitle>{editId ? "Editar funcionário" : "Novo funcionário"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3"><div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">Funcionários cadastrados aqui são <strong className="text-foreground">vendedores de frente de caixa</strong> e acessam somente o Balcão.</div>
            <div className="space-y-2"><label className="text-sm font-medium">Nome *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">E-mail de acesso *</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vendedor@empresa.com" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">{editId ? "Nova senha (opcional)" : "Senha *"}</label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editId ? "Deixe em branco para manter" : "Mínimo de 6 caracteres"} /></div>
          </div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button className="w-full sm:w-auto" variant="outline" onClick={reset}>Cancelar</Button><Button className="w-full sm:w-auto" onClick={save} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Salvando..." : "Salvar"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4" />Vendedores de frente de caixa</CardTitle></CardHeader><CardContent className="p-0">
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : error ? <div className="p-8 text-center text-destructive">{error.message}</div> : !employees?.length ? <div className="p-8 text-center text-muted-foreground">Nenhum funcionário cadastrado.</div> : <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader><TableBody>{employees.map((employee: any) => <TableRow key={employee.id}><TableCell className="font-medium">{employee.name}</TableCell><TableCell>{employee.email}</TableCell><TableCell><Badge variant="secondary">Vendedor de balcão</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Editar ${employee.name}`} onClick={() => openEdit(employee)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" aria-label={`Excluir ${employee.name}`} onClick={() => setDeleteId(employee.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>}
    </CardContent></Card>
    <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover funcionário</AlertDialogTitle><AlertDialogDescription>O funcionário não poderá mais entrar no Balcão. Esta ação não apaga documentos comerciais já vinculados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate({ id: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
