export const ORDER_STATUSES = ["aprovado", "em_producao", "pronto", "entregue", "cancelado"] as const;
export const ORDER_STATUS_LABELS: Record<string, string> = {
  aprovado: "Aprovado",
  em_producao: "Em Produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
export const ORDER_STATUS_COLORS: Record<string, string> = {
  aprovado: "bg-blue-100 text-blue-800",
  em_producao: "bg-yellow-100 text-yellow-800",
  pronto: "bg-green-100 text-green-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

export const QUOTE_STATUSES = ["rascunho", "aprovado", "rejeitado", "convertido"] as const;
export const QUOTE_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  convertido: "Convertido",
};
export const QUOTE_STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  convertido: "bg-blue-100 text-blue-800",
};

export const PURCHASE_STATUSES = ["pendente", "confirmado", "recebido", "cancelado"] as const;
export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recebido: "Recebido",
  cancelado: "Cancelado",
};
export const PURCHASE_STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  recebido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export const PAYMENT_TERMS = ["a_vista", "15_dias", "30_dias"] as const;
export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  a_vista: "À Vista",
  "15_dias": "15 Dias",
  "30_dias": "30 Dias",
};

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];
