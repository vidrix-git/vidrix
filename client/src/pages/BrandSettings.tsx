import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Image, Palette, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BrandForm = {
  displayName: string; legalName: string; tagline: string; logoUrl: string;
  primaryColor: string; phone: string; email: string; address: string;
};

const emptyBrand: BrandForm = { displayName: "", legalName: "", tagline: "", logoUrl: "", primaryColor: "#0f766e", phone: "", email: "", address: "" };

export default function BrandSettings() {
  const utils = trpc.useUtils();
  const { data: brand, isLoading } = trpc.brandSettings.get.useQuery();
  const updateBrand = trpc.brandSettings.update.useMutation({
    onSuccess: async () => {
      await utils.brandSettings.get.invalidate();
      toast.success("Marca atualizada. A nova identidade será aplicada imediatamente.");
    },
    onError: (error) => toast.error(error.message),
  });
  const [form, setForm] = useState<BrandForm>(emptyBrand);

  useEffect(() => {
    if (brand) setForm({
      displayName: brand.displayName || "", legalName: brand.legalName || "", tagline: brand.tagline || "",
      logoUrl: brand.logoUrl || "", primaryColor: brand.primaryColor || "#0f766e", phone: brand.phone || "",
      email: brand.email || "", address: brand.address || "",
    });
  }, [brand]);

  const update = (field: keyof BrandForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const save = (event: React.FormEvent) => { event.preventDefault(); updateBrand.mutate(form); };

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando configurações de marca...</div>;

  return <div className="space-y-6 max-w-5xl">
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex gap-4 items-start">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: form.primaryColor }}><Building2 className="h-5 w-5" /></div>
        <div><h1 className="text-2xl font-semibold tracking-tight">Marca white label</h1><p className="text-sm text-muted-foreground mt-1">Defina a identidade exibida no acesso, navegação e documentos comerciais desta operação.</p></div>
      </div>
    </section>

    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Identidade da empresa</CardTitle><CardDescription>Informações apresentadas ao usuário e nos orçamentos.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="brand-display-name">Nome de exibição</Label><Input id="brand-display-name" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} autoFocus /></div>
          <div className="space-y-2"><Label htmlFor="brand-legal-name">Razão social</Label><Input id="brand-legal-name" value={form.legalName} onChange={(e) => update("legalName", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="brand-tagline">Descrição curta</Label><Input id="brand-tagline" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Ex.: Gestão comercial e operacional" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="brand-logo">URL do logotipo</Label><Input id="brand-logo" type="url" value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Contato institucional</CardTitle><CardDescription>Utilizado como referência nos documentos comerciais.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="brand-phone">Telefone</Label><Input id="brand-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="brand-email">E-mail</Label><Input id="brand-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="brand-address">Endereço</Label><Textarea id="brand-address" value={form.address} onChange={(e) => update("address", e.target.value)} rows={3} /></div>
        </CardContent></Card>
        <div className="flex justify-end"><Button type="submit" data-enter-target disabled={updateBrand.isPending}>{updateBrand.isPending ? "Salvando..." : "Salvar identidade"}</Button></div>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="flex gap-2 items-center"><Palette className="h-4 w-4" /> Cor principal</CardTitle></CardHeader><CardContent className="space-y-4"><input aria-label="Cor principal" type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-12 w-full cursor-pointer rounded-md border bg-transparent p-1" /><Input value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} placeholder="#0f766e" /></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex gap-2 items-center"><Image className="h-4 w-4" /> Prévia</CardTitle></CardHeader><CardContent><div className="rounded-xl border p-4 space-y-2"><div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center text-white" style={{ backgroundColor: form.primaryColor }}>{form.logoUrl ? <img src={form.logoUrl} alt="Prévia do logotipo" className="h-full w-full object-cover" /> : <Building2 className="h-4 w-4" />}</div><strong className="block">{form.displayName || "Sua Empresa"}</strong><p className="text-xs text-muted-foreground">{form.tagline || "Sistema de gestão comercial"}</p></div></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/50"><CardContent className="pt-6 flex gap-3"><ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" /><p className="text-sm text-amber-950">A identidade só pode ser alterada por contas Superadministradoras.</p></CardContent></Card>
      </div>
    </form>
  </div>;
}
