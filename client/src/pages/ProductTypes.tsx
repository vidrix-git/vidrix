import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CirclePlus, FilePenLine, Layers3, Pencil, ShieldCheck, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductTypes() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: types, isLoading } = trpc.productTypes.list.useQuery();
  const reset = () => { setOpen(false); setId(null); setName(""); };
  const create = trpc.productTypes.create.useMutation({ onSuccess: () => { utils.productTypes.list.invalidate(); toast.success("Categoria adicionada ao catálogo"); reset(); }, onError: (error) => toast.error(error.message) });
  const update = trpc.productTypes.update.useMutation({ onSuccess: () => { utils.productTypes.list.invalidate(); utils.products.list.invalidate(); toast.success("Categoria atualizada"); reset(); }, onError: (error) => toast.error(error.message) });
  const remove = trpc.productTypes.delete.useMutation({ onSuccess: () => { utils.productTypes.list.invalidate(); setDeleteId(null); toast.success("Categoria removida"); }, onError: (error) => toast.error(error.message) });
  const isSaving = create.isPending || update.isPending;
  const save = () => {
    const normalizedName = name.trim();
    if (!normalizedName) { toast.error("Informe o nome da categoria"); return; }
    if (id) update.mutate({ id, name: normalizedName }); else create.mutate({ name: normalizedName });
  };
  const openEdit = (type: { id: number; name: string }) => { setId(type.id); setName(type.name); setOpen(true); };

  return <div className="space-y-6">
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><div className="mb-2 flex items-center gap-2 text-primary"><Tags className="h-5 w-5" /><span className="text-sm font-semibold">CATÁLOGO COMERCIAL</span></div><h1 className="text-2xl font-bold text-foreground">Gestão de tipos de produto</h1><p className="mt-2 text-sm text-muted-foreground">Crie as categorias que aparecerão no formulário de Produtos. Alterações aqui mantêm o catálogo organizado e o seletor sempre atualizado.</p></div>
        <Dialog open={open} onOpenChange={(value) => value ? setOpen(true) : reset()}>
          <DialogTrigger asChild><Button className="shadow-sm"><CirclePlus className="mr-2 h-4 w-4" />Adicionar categoria</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md"><DialogHeader><DialogTitle>{id ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader><div className="space-y-2 py-4"><label htmlFor="product-type-name" className="text-sm font-medium">Nome da categoria *</label><Input id="product-type-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Vidro temperado" /><p className="text-xs text-muted-foreground">Pressione Enter para avançar até Salvar.</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button className="w-full sm:w-auto" variant="outline" onClick={reset}>Cancelar</Button><Button data-enter-target className="w-full sm:w-auto" onClick={save} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar categoria"}</Button></div></DialogContent>
        </Dialog>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categorias ativas</p><p className="mt-1 text-2xl font-bold text-foreground">{types?.length ?? 0}</p></div><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uso</p><p className="mt-1 text-sm font-semibold text-foreground">Seleção em Produtos</p></div><div className="rounded-lg border bg-background/80 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Operações</p><p className="mt-1 text-sm font-semibold text-foreground">Adicionar, editar e remover</p></div></div>
    </section>

    <Card><CardHeader className="gap-3 border-b"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><Layers3 className="h-4 w-4 text-primary" />Categorias cadastradas</CardTitle><Badge variant="secondary">{types?.length ?? 0} no catálogo</Badge></div><p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Uma categoria vinculada a produtos não poderá ser excluída até que seus produtos sejam reclassificados.</p></CardHeader><CardContent className="p-0">{isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando categorias...</div> : !types?.length ? <div className="p-10 text-center"><Tags className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhuma categoria cadastrada</p><p className="mt-1 text-sm text-muted-foreground">Use “Adicionar categoria” para iniciar o catálogo.</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="w-[220px] text-right">Gerenciar</TableHead></TableRow></TableHeader><TableBody>{types.map((type) => <TableRow key={type.id}><TableCell><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Tags className="h-4 w-4" /></span><div><p className="font-medium">{type.name}</p><p className="text-xs text-muted-foreground">Disponível no cadastro de produtos</p></div></div></TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" aria-label={`Editar ${type.name}`} onClick={() => openEdit(type)}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</Button><Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Remover ${type.name}`} onClick={() => setDeleteId(type.id)}><Trash2 className="mr-2 h-3.5 w-3.5" />Remover</Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>

    <AlertDialog open={deleteId !== null} onOpenChange={(value) => !value && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover categoria</AlertDialogTitle><AlertDialogDescription>Esta ação remove a categoria do catálogo. Categorias vinculadas a produtos continuam protegidas e não podem ser removidas.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate({ id: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover categoria</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
