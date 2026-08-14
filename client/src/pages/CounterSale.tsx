import { useMemo, useState } from "react";
import { ClipboardCheck, FileText, PackagePlus, Plus, ShoppingBasket, Trash2, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toClientMutationInput, type ClientMutationForm } from "../../../shared/client-contract";
import { formatClientDocument, formatPhone } from "../../../shared/client-identifiers";
import { applyQuickClientCompletion } from "../../../shared/counter-client";
import { toast } from "sonner";

type SaleItem = { key: number; productId: string; width: string; height: string; quantity: string; unitPrice: string; notes: string };
type ExtraKind = "acessorio" | "massa" | "tarugo" | "moldura" | "montagem";
type CommercialExtra = { key: number; kind: ExtraKind; description: string; unit: "un" | "kg" | "cm" | "m" | "servico"; quantity: string; unitPrice: string; productId: string; notes: string };

const emptyItem = (key: number): SaleItem => ({ key, productId: "", width: "100", height: "100", quantity: "1", unitPrice: "", notes: "" });
const emptyExtra = (key: number, kind: ExtraKind = "acessorio"): CommercialExtra => ({ key, kind, description: "", unit: kind === "massa" ? "kg" : kind === "moldura" ? "cm" : kind === "montagem" ? "servico" : "un", quantity: "1", unitPrice: "0", productId: "", notes: "" });
const emptyQuickClient: ClientMutationForm = { name: "", type: "PF", cpfCnpj: "", phone: "", whatsApp: "", email: "", address: "", neighborhood: "", city: "", state: "", zipCode: "" };

function decimal(value: string) {
  const compact = value.trim().replace(/\s+/g, "");
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const extraLabels: Record<ExtraKind, string> = { acessorio: "Acessório", massa: "Massa", tarugo: "Tarugo", moldura: "Moldura", montagem: "Montagem" };

export default function CounterSale() {
  const utils = trpc.useUtils();
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = trpc.clients.list.useQuery();
  const { data: products = [], isLoading: productsLoading, error: productsError } = trpc.products.list.useQuery();
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([emptyItem(1)]);
  const [extras, setExtras] = useState<CommercialExtra[]>([]);
  const [outcome, setOutcome] = useState<"quote" | "sale" | null>(null);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClient, setQuickClient] = useState<ClientMutationForm>(emptyQuickClient);

  const itemTotal = useMemo(() => items.reduce((total, item) => total + ((decimal(item.width) * decimal(item.height) / 10000) * decimal(item.quantity) * decimal(item.unitPrice) || 0), 0), [items]);
  const extraTotal = useMemo(() => extras.reduce((total, extra) => total + (decimal(extra.quantity) * decimal(extra.unitPrice) || 0), 0), [extras]);
  const estimatedTotal = itemTotal + extraTotal;
  const matchingClients = useMemo(() => {
    const search = clientSearch.trim().toLocaleLowerCase("pt-BR");
    if (!search) return clients;
    return clients.filter((client: any) => [client.name, client.cpfCnpj, client.phone, client.whatsApp]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(search)));
  }, [clients, clientSearch]);

  const mutation = trpc.counterSales.finalize.useMutation({
    onSuccess: (result) => {
      const reference = result.outcome === "sale" ? `Venda #${result.orderId} concluída` : `Orçamento #${result.quoteId} salvo`;
      toast.success(`${reference} — total R$ ${Number(result.totalAmount).toFixed(2)}`);
      utils.products.list.invalidate(); utils.orders.list.invalidate(); utils.quotes.list.invalidate(); utils.stockMovements.list.invalidate();
      setClientId(""); setClientSearch(""); setNotes(""); setOutcome(null); setExtras([]); setItems([emptyItem(Date.now())]);
    },
    onError: (error) => toast.error(error.message),
  });

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (result) => {
      applyQuickClientCompletion(result.insertId, { setClientId, setClientSearch, setShowQuickClient });
      setQuickClient(emptyQuickClient);
      utils.clients.list.invalidate();
      toast.success("Cliente cadastrado e selecionado para este atendimento");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateItem = (key: number, patch: Partial<SaleItem>) => setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  const updateExtra = (key: number, patch: Partial<CommercialExtra>) => setExtras((current) => current.map((extra) => extra.key === key ? { ...extra, ...patch } : extra));
  const chooseProduct = (item: SaleItem, productId: string) => {
    const product = products.find((entry: any) => String(entry.id) === productId) as any;
    updateItem(item.key, { productId, unitPrice: product ? String(product.unitPrice) : item.unitPrice });
  };
  const catalogReady = !productsLoading && !productsError && products.length > 0;
  const submit = () => {
    if (!outcome) return toast.error("Escolha se deseja salvar como orçamento ou concluir como venda");
    if (!catalogReady) return toast.error("Aguarde o carregamento dos produtos necessários para concluir o atendimento");
    if (!clientId) return toast.error("Selecione ou cadastre o cliente para concluir o atendimento");
    if (items.some((item) => !item.productId || !item.width || !item.height || !item.quantity || !item.unitPrice)) return toast.error("Preencha produto, dimensões, quantidade e preço de todos os itens");
    if (extras.some((extra) => !extra.description || !extra.quantity || !extra.unitPrice)) return toast.error("Preencha descrição, quantidade e preço de todos os complementos");
    mutation.mutate({ outcome, clientId: Number(clientId), notes: notes || null, items: items.map(({ productId, width, height, quantity, unitPrice, notes: itemNotes }) => ({ productId: Number(productId), width, height, quantity, unitPrice, notes: itemNotes || null })), extras: extras.map(({ kind, description, unit, quantity, unitPrice, productId, notes: extraNotes }) => ({ kind, description, unit, quantity, unitPrice, productId: productId ? Number(productId) : null, notes: extraNotes || null })) });
  };
  const submitQuickClient = () => createClientMutation.mutate(toClientMutationInput(quickClient));

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold">Atendimento de Balcão</h1><p className="text-sm text-muted-foreground">Monte os itens primeiro e escolha no encerramento se será orçamento ou venda.</p></div><div className="rounded-lg border bg-card px-4 py-3 text-right"><p className="text-xs text-muted-foreground">Total estimado</p><p className="text-xl font-bold">R$ {estimatedTotal.toFixed(2)}</p></div></div>

    <Card><CardHeader><CardTitle>Atendimento</CardTitle><CardDescription>O cliente é selecionado somente ao finalizar. Use observações para condições comerciais ou detalhes do balcão.</CardDescription></CardHeader><CardContent><div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Forma de pagamento ou observação do atendimento" className="min-h-10" /></div></CardContent></Card>

    <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Vidros</CardTitle><CardDescription>Dimensões em centímetros; preço por metro quadrado.</CardDescription></div><Button variant="outline" size="sm" onClick={() => setItems((current) => [...current, emptyItem(Date.now())])}><Plus className="mr-2 h-4 w-4" />Adicionar vidro</Button></CardHeader><CardContent className="space-y-3">
      {productsError ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Não foi possível carregar os produtos. Atualize a página e tente novamente.</p> : productsLoading ? <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">Carregando produtos…</p> : products.length === 0 ? <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">Cadastre ao menos um produto antes de realizar o atendimento.</p> : null}
      {items.map((item) => <div key={item.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,2fr)_repeat(4,minmax(90px,1fr))_40px]"><div className="space-y-1"><Label>Produto</Label><select value={item.productId} onChange={(e) => chooseProduct(item, e.target.value)} disabled={productsLoading || Boolean(productsError) || products.length === 0} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"><option value="">Selecione</option>{products.map((product: any) => <option key={product.id} value={product.id}>{product.name} — estoque {product.stockQuantity}</option>)}</select></div><div className="space-y-1"><Label>Larg. (cm)</Label><Input inputMode="decimal" value={item.width} onChange={(e) => updateItem(item.key, { width: e.target.value })} /></div><div className="space-y-1"><Label>Alt. (cm)</Label><Input inputMode="decimal" value={item.height} onChange={(e) => updateItem(item.key, { height: e.target.value })} /></div><div className="space-y-1"><Label>Qtd.</Label><Input inputMode="numeric" value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} /></div><div className="space-y-1"><Label>Preço/m²</Label><Input inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })} /></div><Button variant="ghost" size="icon" className="self-end text-destructive" onClick={() => setItems((current) => current.length === 1 ? current : current.filter((entry) => entry.key !== item.key))} aria-label="Remover vidro"><Trash2 className="h-4 w-4" /></Button></div>)}
    </CardContent></Card>

    <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Complementos</CardTitle><CardDescription>Acessórios, massa, tarugo, moldura e montagem entram no mesmo total. Vincule um produto somente quando houver baixa de estoque.</CardDescription></div><Button variant="outline" size="sm" onClick={() => setExtras((current) => [...current, emptyExtra(Date.now())])}><PackagePlus className="mr-2 h-4 w-4" />Adicionar complemento</Button></CardHeader><CardContent className="space-y-3">{extras.length === 0 ? <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">Nenhum complemento adicionado a este atendimento.</p> : extras.map((extra) => <div key={extra.key} className="grid gap-3 rounded-lg border p-3 md:grid-cols-2 xl:grid-cols-[130px_minmax(160px,2fr)_90px_90px_110px_minmax(150px,1fr)_40px]"><div className="space-y-1"><Label>Tipo</Label><select value={extra.kind} onChange={(e) => { const kind = e.target.value as ExtraKind; updateExtra(extra.key, { kind, unit: kind === "massa" ? "kg" : kind === "moldura" ? "cm" : kind === "montagem" ? "servico" : "un" }); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(extraLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-1"><Label>Descrição</Label><Input value={extra.description} onChange={(e) => updateExtra(extra.key, { description: e.target.value })} placeholder={extraLabels[extra.kind]} /></div><div className="space-y-1"><Label>Unidade</Label><select value={extra.unit} onChange={(e) => updateExtra(extra.key, { unit: e.target.value as CommercialExtra["unit"] })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="un">un</option><option value="kg">kg</option><option value="cm">cm</option><option value="m">m</option><option value="servico">serviço</option></select></div><div className="space-y-1"><Label>Qtd.</Label><Input inputMode="decimal" value={extra.quantity} onChange={(e) => updateExtra(extra.key, { quantity: e.target.value })} /></div><div className="space-y-1"><Label>Valor un.</Label><Input inputMode="decimal" value={extra.unitPrice} onChange={(e) => updateExtra(extra.key, { unitPrice: e.target.value })} /></div><div className="space-y-1"><Label>Produto estoque</Label><select value={extra.productId} onChange={(e) => updateExtra(extra.key, { productId: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Não movimenta estoque</option>{products.map((product: any) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div><Button variant="ghost" size="icon" className="self-end text-destructive" onClick={() => setExtras((current) => current.filter((entry) => entry.key !== extra.key))} aria-label="Remover complemento"><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>

    <Card><CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:justify-end"><Button size="lg" variant="outline" onClick={() => setOutcome("quote")} disabled={!catalogReady}><FileText className="mr-2 h-5 w-5" />Salvar como orçamento</Button><Button size="lg" onClick={() => setOutcome("sale")} disabled={!catalogReady}><ShoppingBasket className="mr-2 h-5 w-5" />Concluir como venda</Button></CardContent></Card>

    {outcome && <Card className="border-primary/40"><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Finalizar como {outcome === "sale" ? "Venda" : "Orçamento"}</CardTitle><CardDescription>{outcome === "sale" ? "A venda exige cliente e baixará o estoque ao ser confirmada." : "O orçamento será salvo para acompanhamento, sem movimentar o estoque."}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between gap-2"><Label>Cliente *</Label><Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setShowQuickClient((value) => !value)}><UserPlus className="mr-1 h-4 w-4" />{showQuickClient ? "Usar cliente existente" : "Cadastrar novo cliente"}</Button></div>{clientsError ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Não foi possível carregar os clientes. Atualize a página e tente novamente.</p> : clientsLoading ? <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">Carregando clientes…</p> : !showQuickClient ? <div className="space-y-2"><Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ, telefone ou WhatsApp" aria-label="Buscar cliente" /><select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione o cliente para concluir</option>{matchingClients.map((client: any) => <option key={client.id} value={client.id}>{client.name}{client.whatsApp ? ` — WhatsApp ${client.whatsApp}` : ""}</option>)}</select>{matchingClients.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente encontrado. Cadastre um novo cliente para continuar.</p>}</div> : <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2"><div className="space-y-1 sm:col-span-2"><Label>Nome *</Label><Input value={quickClient.name} onChange={(e) => setQuickClient((value) => ({ ...value, name: e.target.value }))} /></div><div className="space-y-1"><Label>Tipo *</Label><select value={quickClient.type} onChange={(e) => setQuickClient((value) => ({ ...value, type: e.target.value as ClientMutationForm["type"], cpfCnpj: "" }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></div><div className="space-y-1"><Label>{quickClient.type === "PF" ? "CPF" : "CNPJ"} *</Label><Input value={quickClient.cpfCnpj} onChange={(e) => setQuickClient((value) => ({ ...value, cpfCnpj: formatClientDocument(e.target.value, value.type) }))} /></div><div className="space-y-1"><Label>Telefone</Label><Input value={quickClient.phone ?? ""} onChange={(e) => setQuickClient((value) => ({ ...value, phone: formatPhone(e.target.value) }))} /></div><div className="space-y-1"><Label>WhatsApp</Label><Input value={quickClient.whatsApp ?? ""} onChange={(e) => setQuickClient((value) => ({ ...value, whatsApp: formatPhone(e.target.value) }))} /></div><div className="sm:col-span-2 flex justify-end"><Button type="button" onClick={submitQuickClient} disabled={createClientMutation.isPending}>{createClientMutation.isPending ? "Cadastrando..." : "Cadastrar e selecionar cliente"}</Button></div></div>}</div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setOutcome(null)}>Voltar ao atendimento</Button><Button size="lg" onClick={submit} disabled={mutation.isPending || !catalogReady || clientsLoading || Boolean(clientsError)}>{mutation.isPending ? "Finalizando..." : outcome === "sale" ? "Confirmar venda" : "Confirmar orçamento"}</Button></div></CardContent></Card>}
  </div>;
}
