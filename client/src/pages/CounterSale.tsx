import { useMemo, useState } from "react";
import { Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type SaleItem = { key: number; productId: string; width: string; height: string; quantity: string; unitPrice: string; notes: string };
const emptyItem = (key: number): SaleItem => ({ key, productId: "", width: "100", height: "100", quantity: "1", unitPrice: "", notes: "" });

export default function CounterSale() {
  const utils = trpc.useUtils();
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = trpc.clients.list.useQuery();
  const { data: products = [], isLoading: productsLoading, error: productsError } = trpc.products.list.useQuery();
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([emptyItem(1)]);

  const estimatedTotal = useMemo(() => items.reduce((total, item) => {
    const width = Number(item.width.replace(",", ".")); const height = Number(item.height.replace(",", "."));
    const quantity = Number(item.quantity); const price = Number(item.unitPrice.replace(",", "."));
    return total + ((width * height / 10000) * quantity * price || 0);
  }, 0), [items]);

  const mutation = trpc.counterSales.create.useMutation({
    onSuccess: (result) => {
      toast.success(`Venda de balcão #${result.orderId} concluída — total R$ ${Number(result.totalAmount).toFixed(2)}`);
      utils.products.list.invalidate(); utils.orders.list.invalidate(); utils.stockMovements.list.invalidate();
      setClientId(""); setNotes(""); setItems([emptyItem(Date.now())]);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateItem = (key: number, patch: Partial<SaleItem>) => setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  const chooseProduct = (item: SaleItem, productId: string) => {
    const product = products.find((entry: any) => String(entry.id) === productId) as any;
    updateItem(item.key, { productId, unitPrice: product ? String(product.unitPrice) : item.unitPrice });
  };
  const catalogReady = !clientsLoading && !productsLoading && !clientsError && !productsError && clients.length > 0 && products.length > 0;
  const submit = () => {
    if (!catalogReady) return toast.error("Aguarde o carregamento dos cadastros necessários para concluir a venda");
    if (!clientId) return toast.error("Selecione o cliente da venda");
    if (items.some((item) => !item.productId || !item.width || !item.height || !item.quantity || !item.unitPrice)) return toast.error("Preencha produto, dimensões, quantidade e preço de todos os itens");
    mutation.mutate({ clientId: Number(clientId), notes: notes || null, items: items.map(({ productId, width, height, quantity, unitPrice, notes: itemNotes }) => ({ productId: Number(productId), width, height, quantity, unitPrice, notes: itemNotes || null })) });
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-bold">Venda Direta</h1><p className="text-sm text-muted-foreground">Balcão: conclua a venda, dê baixa no estoque e registre o pedido entregue.</p></div>
      <div className="rounded-lg border bg-card px-4 py-3 text-right"><p className="text-xs text-muted-foreground">Total estimado</p><p className="text-xl font-bold">R$ {estimatedTotal.toFixed(2)}</p></div>
    </div>
    <Card><CardHeader><CardTitle>Dados da venda</CardTitle><CardDescription>A venda será criada como pedido entregue e ficará disponível no histórico.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2"><Label>Cliente *</Label>
        {clientsError ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Não foi possível carregar os clientes. Atualize a página e tente novamente.</p>
          : clientsLoading ? <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">Carregando clientes…</p>
            : clients.length === 0 ? <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">Cadastre ao menos um cliente antes de realizar uma venda de balcão.</p>
              : <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione o cliente</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}{client.whatsApp ? ` — WhatsApp ${client.whatsApp}` : ""}</option>)}</select>}
      </div>
      <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Forma de pagamento ou observação da venda" className="min-h-10" /></div>
    </CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Itens</CardTitle><CardDescription>Dimensões em centímetros; preço por metro quadrado.</CardDescription></div><Button variant="outline" size="sm" onClick={() => setItems((current) => [...current, emptyItem(Date.now())])}><Plus className="mr-2 h-4 w-4" />Adicionar item</Button></CardHeader><CardContent className="space-y-3">
      {productsError ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Não foi possível carregar os produtos. Atualize a página e tente novamente.</p>
        : productsLoading ? <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">Carregando produtos…</p>
          : products.length === 0 ? <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">Cadastre ao menos um produto com estoque antes de realizar uma venda de balcão.</p>
            : null}
      {items.map((item) => <div key={item.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,2fr)_repeat(4,minmax(90px,1fr))_40px]">
        <div className="space-y-1"><Label>Produto</Label><select value={item.productId} onChange={(e) => chooseProduct(item, e.target.value)} disabled={productsLoading || Boolean(productsError) || products.length === 0} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"><option value="">{productsLoading ? "Carregando produtos…" : "Selecione"}</option>{products.map((product: any) => <option key={product.id} value={product.id}>{product.name} — estoque {product.stockQuantity}</option>)}</select></div>
        <div className="space-y-1"><Label>Larg. (cm)</Label><Input inputMode="decimal" value={item.width} onChange={(e) => updateItem(item.key, { width: e.target.value })} /></div>
        <div className="space-y-1"><Label>Alt. (cm)</Label><Input inputMode="decimal" value={item.height} onChange={(e) => updateItem(item.key, { height: e.target.value })} /></div>
        <div className="space-y-1"><Label>Qtd.</Label><Input inputMode="numeric" value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} /></div>
        <div className="space-y-1"><Label>Preço/m²</Label><Input inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })} /></div>
        <Button variant="ghost" size="icon" className="self-end text-destructive" onClick={() => setItems((current) => current.length === 1 ? current : current.filter((entry) => entry.key !== item.key))} aria-label="Remover item"><Trash2 className="h-4 w-4" /></Button>
      </div>)}
      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button size="lg" onClick={submit} disabled={mutation.isPending || !catalogReady}><ShoppingBasket className="mr-2 h-5 w-5" />{mutation.isPending ? "Concluindo..." : "Concluir venda de balcão"}</Button></div>
    </CardContent></Card>
  </div>;
}
