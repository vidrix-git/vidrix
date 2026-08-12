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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, RotateCcw, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QuoteItemForm = {
  productId: string;
  width: string;
  height: string;
  quantity: string;
  unitPrice: string;
};

const statusLabels: Record<string, string> = {
  "rascunho": "Rascunho",
  "enviado": "Enviado",
  "aprovado": "Aprovado",
  "rejeitado": "Rejeitado",
  "convertido": "Convertido",
};

export default function Quotes() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [items, setItems] = useState<QuoteItemForm[]>([]);

  // Form
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: quotes, isLoading } = trpc.quotes.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: itemsData } = trpc.quotes.getItems.useQuery(
    { id: detailId || 0 },
    { enabled: detailId !== null }
  );

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: (res: any) => {
      utils.quotes.list.invalidate();
      toast.success("Orçamento criado. Adicione os itens.");
      setDetailId(res.insertId);
      setActiveTab("detail");
    },
    onError: (e) => toast.error(e.message),
  });

  const addItemMutation = trpc.quotes.addItem.useMutation({
    onSuccess: () => {
      utils.quotes.getItems.invalidate({ id: detailId || 0 });
      utils.quotes.list.invalidate();
      toast.success("Item adicionado");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItemMutation = trpc.quotes.deleteItem.useMutation({
    onSuccess: () => {
      utils.quotes.getItems.invalidate({ id: detailId || 0 });
      utils.quotes.list.invalidate();
      toast.success("Item removido");
    },
    onError: (e) => toast.error(e.message),
  });

  const convertMutation = trpc.quotes.convertToOrder.useMutation({
    onSuccess: (res: any) => {
      utils.quotes.list.invalidate();
      utils.orders.list.invalidate();
      toast.success(`Orçamento convertido em pedido #${res.orderId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      setDeleteId(null);
      toast.success("Orçamento excluído");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateQuote = () => {
    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    createMutation.mutate({
      clientId: parseInt(clientId),
      notes: notes || null,
      status: "rascunho",
    } as any);
  };

  const handleAddItem = () => {
    const newItem = { productId: "", width: "", height: "", quantity: "1", unitPrice: "" };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof QuoteItemForm, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcSubtotal = (item: QuoteItemForm) => {
    const w = parseFloat(item.width) || 0;
    const h = parseFloat(item.height) || 0;
    const q = parseInt(item.quantity) || 0;
    const p = parseFloat(item.unitPrice) || 0;
    return (w * h / 10000 * q * p).toFixed(2);
  };

  const handleSubmitItems = () => {
    if (!detailId) return;
    const validItems = items.filter(i => i.productId && i.width && i.height && i.unitPrice);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item válido");
      return;
    }
    let pending = validItems.length;
    for (const item of validItems) {
      const product = products?.find((p: any) => p.id === parseInt(item.productId));
      const price = item.unitPrice || String(product?.unitPrice || "0");
      addItemMutation.mutate({
        quoteId: detailId,
        productId: parseInt(item.productId),
        width: item.width,
        height: item.height,
        quantity: item.quantity || "1",
        unitPrice: price,
      } as any, {
        onSettled: () => {
          pending--;
          if (pending === 0) {
            setItems([]);
            toast.success("Todos os itens adicionados");
          }
        },
      });
    }
  };

  const handleConvertToOrder = (quoteId: number) => {
    if (window.confirm("Converter este orçamento em pedido de venda? O estoque será atualizado.")) {
      convertMutation.mutate({ id: quoteId });
    }
  };

  const formatCurrency = (value: string | number) => {
    return `R$ ${parseFloat(String(value)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const generateQuotePDF = async (quoteId: number) => {
    const quote = quotes?.find((q: any) => q.id === quoteId);
    const client = clients?.find((c: any) => c.id === quote?.clientId);

    if (!quote) {
      toast.error("Orçamento não encontrado");
      return;
    }

    const items = await utils.quotes.getItems.fetch({ id: quoteId });

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text("Vidrix ERP", 20, 25);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Orçamento #" + quoteId, 20, 35);

    // Client info
    doc.setFontSize(10);
    doc.text("Cliente: " + (client?.name || "N/A"), 20, 50);
    doc.text("Data: " + new Date(quote.createdAt).toLocaleDateString("pt-BR"), 20, 56);
    doc.text("Status: " + (statusLabels[quote.status] || quote.status), 20, 62);

    // Items table
    const tableData = (items as any[])?.map((item: any) => {
      const product = products?.find((p: any) => p.id === item.productId);
      return [
        product?.name || "-",
        item.width + " mm",
        item.height + " mm",
        item.quantity,
        parseFloat(String(item.squareMeters)).toFixed(4) + " m²",
        "R$ " + parseFloat(String(item.unitPrice)).toFixed(2),
        "R$ " + parseFloat(String(item.subtotal)).toFixed(2),
      ];
    }) || [];

    autoTable(doc, {
      startY: 70,
      head: [["Produto", "Larg.", "Alt.", "Qtd", "m²", "Preço/m²", "Subtotal"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total: R$ " + parseFloat(String(quote.totalAmount)).toFixed(2), 20, finalY + 15);

    doc.save(`orcamento_${quoteId}.pdf`);
    toast.success("PDF gerado com sucesso");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "rascunho": "bg-gray-100 text-gray-800",
      "enviado": "bg-blue-100 text-blue-800",
      "aprovado": "bg-green-100 text-green-800",
      "rejeitado": "bg-red-100 text-red-800",
      "convertido": "bg-purple-100 text-purple-800",
    };
    return <Badge className={styles[status] || ""}>{statusLabels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie orçamentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setClientId(""); setNotes(""); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="list">Informações</TabsTrigger>
                <TabsTrigger value="detail" disabled={!detailId}>Itens</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente *</label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações do orçamento" />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateQuote} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar Orçamento"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="detail" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adicionar Itens</label>
                  {items.map((item, idx) => {
                    const w = parseFloat(item.width) || 0;
                    const h = parseFloat(item.height) || 0;
                    const q = parseInt(item.quantity) || 0;
                    const p = parseFloat(item.unitPrice) || 0;
                    const m2 = (w * h / 10000 * q).toFixed(4);
                    return (
                      <div key={idx} className="flex items-end gap-2 p-3 border rounded-lg bg-secondary/30">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Produto</label>
                          <Select value={item.productId} onValueChange={(v) => updateItem(idx, "productId", v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {products?.map((prod: any) => (
                                <SelectItem key={prod.id} value={String(prod.id)}>{prod.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <label className="text-xs text-muted-foreground">Larg. (mm)</label>
                          <Input value={item.width} onChange={(e) => updateItem(idx, "width", e.target.value)} placeholder="1000" />
                        </div>
                        <div className="w-20">
                          <label className="text-xs text-muted-foreground">Alt. (mm)</label>
                          <Input value={item.height} onChange={(e) => updateItem(idx, "height", e.target.value)} placeholder="500" />
                        </div>
                        <div className="w-16">
                          <label className="text-xs text-muted-foreground">Qtd</label>
                          <Input value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} placeholder="1" />
                        </div>
                        <div className="w-24">
                          <label className="text-xs text-muted-foreground">Preço/m²</label>
                          <Input value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} placeholder="R$" />
                        </div>
                        <div className="text-right min-w-[120px]">
                          <p className="text-xs text-muted-foreground">{m2} m²</p>
                          <p className="font-semibold text-sm">R$ {calcSubtotal(item)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                  </Button>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => { setDetailId(null); setActiveTab("list"); setItems([]); }}>Voltar</Button>
                  <Button onClick={handleSubmitItems} disabled={addItemMutation.isPending}>
                    {addItemMutation.isPending ? "Salvando..." : "Salvar Itens"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quotes List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !quotes || quotes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum orçamento cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote: any) => {
                  const client = clients?.find((c: any) => c.id === quote.clientId);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">#{quote.id}</TableCell>
                      <TableCell>{client?.name || "-"}</TableCell>
                      <TableCell>{statusBadge(quote.status)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
                      <TableCell>{new Date(quote.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(quote.id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {quote.status === "aprovado" && (
                            <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleConvertToOrder(quote.id)}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => generateQuotePDF(quote.id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(quote.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Todos os itens serão removidos.
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

      {/* Detail Dialog */}
      <Dialog open={detailId !== null && !dialogOpen} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento #{detailId}</DialogTitle>
          </DialogHeader>
          {itemsData && itemsData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Larg. (mm)</TableHead>
                  <TableHead>Alt. (mm)</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>m²</TableHead>
                  <TableHead>Preço/m²</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsData.map((item: any) => {
                  const product = products?.find((p: any) => p.id === item.productId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{product?.name || "-"}</TableCell>
                      <TableCell>{item.width}</TableCell>
                      <TableCell>{item.height}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{parseFloat(String(item.squareMeters)).toFixed(4)}</TableCell>
                      <TableCell>R$ {parseFloat(String(item.unitPrice)).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {parseFloat(String(item.subtotal)).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!itemsData || itemsData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum item neste orçamento</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
