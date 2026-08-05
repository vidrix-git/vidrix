import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit2, FileText, Check, Send, XCircle, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  converted: "Convertido",
};

interface QuoteItem {
  productId: number;
  description?: string;
  width: string;
  height: string;
  quantity: number;
  unitPrice: string;
}

function QuoteForm({ quote, onSuccess }: { quote?: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: products } = trpc.products.list.useQuery({});

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => { utils.quotes.list.invalidate(); toast.success("Orçamento criado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => { utils.quotes.list.invalidate(); toast.success("Orçamento atualizado!"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const [clientId, setClientId] = useState(quote?.clientId?.toString() || "");
  const [notes, setNotes] = useState(quote?.notes || "");
  const [validUntil, setValidUntil] = useState(quote?.validUntil || "");
  const [items, setItems] = useState<QuoteItem[]>(
    quote?.items || [{ productId: 0, width: "0", height: "0", quantity: 1, unitPrice: "0" }]
  );

  const addItem = () => {
    setItems([...items, { productId: 0, width: "0", height: "0", quantity: 1, unitPrice: "0" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: QuoteItem) => {
    const w = parseFloat(item.width) || 0;
    const h = parseFloat(item.height) || 0;
    const areaM2 = (w * h) / 10000;
    const qty = item.quantity || 1;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * areaM2 * price;
  };

  const calculateAreaM2 = (item: QuoteItem) => {
    const w = parseFloat(item.width) || 0;
    const h = parseFloat(item.height) || 0;
    return (w * h) / 10000;
  };

  const totalValue = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Selecione um cliente"); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return; }
    const data = {
      clientId: parseInt(clientId),
      notes,
      validUntil,
      items: items.map((item) => ({
        ...item,
        productId: parseInt(item.productId.toString()),
      })),
    };
    if (quote) {
      updateMutation.mutate({ id: quote.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {clients?.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Validade</Label>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Itens do Orçamento</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const areaM2 = calculateAreaM2(item);
            const itemTotal = calculateItemTotal(item);
            return (
              <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-slate-50">
                <div className="col-span-3">
                  <Label className="text-xs">Produto</Label>
                  <Select value={item.productId.toString()} onValueChange={(v) => updateItem(index, "productId", parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      {products?.filter((p: any) => p.active !== false).map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input value={item.width} onChange={(e) => updateItem(index, "width", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input value={item.height} onChange={(e) => updateItem(index, "height", e.target.value)} />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Preço/m²</Label>
                  <Input value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} />
                </div>
                <div className="col-span-1 flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground">{areaM2.toFixed(4)} m²</span>
                  <span className="text-sm font-medium">R$ {itemTotal.toFixed(2)}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-right mt-3">
          <span className="text-lg font-bold">Total: R$ {totalValue.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
        {createMutation.isPending || updateMutation.isPending ? "Salvando..." : quote ? "Atualizar Orçamento" : "Criar Orçamento"}
      </Button>
    </form>
  );
}

function QuotePDF({ quote }: { quote: any }) {
  const generatePDF = () => {
    const items = quote.items || [];
    const totalM2 = items.reduce((sum: number, item: any) => sum + (parseFloat(item.areaM2) * item.quantity), 0);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Orçamento ${quote.number}</title>
<style>
body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
.header h1 { color: #2563eb; margin: 0; }
.info { display: flex; justify-content: space-between; margin-bottom: 20px; }
.info-box { background: #f8fafc; padding: 15px; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #2563eb; color: white; padding: 10px; text-align: left; }
td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
.total { text-align: right; font-size: 1.3em; font-weight: bold; color: #2563eb; margin-top: 20px; }
.footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 0.85em; }
</style></head>
<body>
<div class="header">
  <h1>Vidrix ERP</h1>
  <p>Orçamento ${quote.number}</p>
</div>
<div class="info">
  <div class="info-box">
    <strong>Cliente:</strong><br/>${quote.client?.name || '-'}<br/>
    <strong>CPF/CNPJ:</strong> ${quote.client?.cpfCnpj || '-'}<br/>
    <strong>Telefone:</strong> ${quote.client?.phone || '-'}
  </div>
  <div class="info-box">
    <strong>Data:</strong> ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}<br/>
    <strong>Validade:</strong> ${quote.validUntil || '-'}<br/>
    <strong>Status:</strong> ${quote.status}
  </div>
</div>
<table>
  <thead><tr><th>Produto</th><th>Larg. (cm)</th><th>Alt. (cm)</th><th>Área (m²)</th><th>Qtd</th><th>Preço/m²</th><th>Total</th></tr></thead>
  <tbody>
    ${items.map((item: any) => `
    <tr>
      <td>${item.product?.name || item.description || '-'}</td>
      <td>${item.width}</td><td>${item.height}</td>
      <td>${parseFloat(item.areaM2).toFixed(4)}</td>
      <td>${item.quantity}</td>
      <td>R$ ${parseFloat(item.unitPrice).toFixed(2)}</td>
      <td>R$ ${parseFloat(item.totalValue).toFixed(2)}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="total">Total Geral: R$ ${parseFloat(quote.totalValue).toFixed(2)} (${totalM2.toFixed(2)} m²)</div>
<div class="footer"><p>Vidrix ERP - Sistema de Gestão Comercial para Vidraçaria</p></div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.print();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={generatePDF} size="sm">
      <FileText className="mr-2 h-4 w-4" /> Gerar PDF
    </Button>
  );
}

export default function Quotes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => { utils.quotes.list.invalidate(); toast.success("Orçamento removido!"); },
    onError: (err) => toast.error(err.message),
  });
  const approveMutation = trpc.quotes.approve.useMutation({
    onSuccess: () => { utils.quotes.list.invalidate(); toast.success("Orçamento aprovado!"); },
    onError: (err) => toast.error(err.message),
  });
  const convertMutation = trpc.orders.create.useMutation({
    onSuccess: () => { utils.quotes.list.invalidate(); toast.success("Orçamento convertido em pedido!"); },
    onError: (err) => toast.error(err.message),
  });

  const { data, isLoading } = trpc.quotes.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const convertToOrder = (quote: any) => {
    if (!quote.clientId) { toast.error("Cliente não encontrado"); return; }
    convertMutation.mutate({ clientId: quote.clientId, quoteId: quote.id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">Criação de orçamentos com cálculo automático de metragem</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingQuote(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuote ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
              </DialogHeader>
              <QuoteForm quote={editingQuote} onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((quote: any) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.number}</TableCell>
                      <TableCell>{quote.clientName || "-"}</TableCell>
                      <TableCell>R$ {parseFloat(quote.totalValue).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[quote.status]}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {quote.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingQuote(quote)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {quote.status === "approved" && (
                            <Button variant="ghost" size="icon" onClick={() => convertToOrder(quote)} title="Converter em Pedido">
                              <ShoppingCart className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {user?.role === "admin" && quote.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: quote.id })}>
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
      </div>
    </DashboardLayout>
  );
}
