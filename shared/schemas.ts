import { z } from "zod";
import { isValidClientDocument, isValidZipCode } from "./client-identifiers";

const parseBrazilianDecimal = (value: string) => {
  const compact = value.trim().replace(/\s+/g, "");
  return Number(compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact);
};

const positiveDecimalString = (field: string) => z.string().trim().refine(
  (value) => Number.isFinite(parseBrazilianDecimal(value)) && parseBrazilianDecimal(value) > 0,
  `${field} deve ser um número positivo`,
);
const positiveIntegerString = (field: string) => z.string().trim().refine(
  (value) => Number.isInteger(Number(value)) && Number(value) > 0,
  `${field} deve ser um número inteiro positivo`,
);
const nonNegativeDecimalString = (field: string) => z.string().trim().refine(
  (value) => Number.isFinite(parseBrazilianDecimal(value)) && parseBrazilianDecimal(value) >= 0,
  `${field} deve ser um número igual ou maior que zero`,
);

// ============================================================
// CLIENTS
// ============================================================
const clientFields = {
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["PF", "PJ"]),
  cpfCnpj: z.string().min(1, "CPF/CNPJ é obrigatório"),
  address: z.string().optional().nullable(),
  addressNumber: z.string().trim().max(32, "Número deve ter até 32 caracteres").optional().nullable(),
  addressComplement: z.string().trim().max(255, "Complemento deve ter até 255 caracteres").optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsApp: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().trim().length(2, "UF deve ter 2 letras").optional().nullable(),
  zipCode: z.string().refine((value) => !value || isValidZipCode(value), "CEP deve ter 8 dígitos").optional().nullable(),
};

export const createClientSchema = z.object(clientFields).superRefine((value, context) => {
  if (!isValidClientDocument(value.cpfCnpj, value.type)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["cpfCnpj"], message: value.type === "PJ" ? "CNPJ inválido" : "CPF inválido" });
  }
});

export const updateClientSchema = z.object({
  id: z.number().int().positive("ID do cliente deve ser positivo"),
  name: clientFields.name.optional(),
  type: clientFields.type.optional(),
  cpfCnpj: clientFields.cpfCnpj.optional(),
  address: clientFields.address,
  addressNumber: clientFields.addressNumber,
  addressComplement: clientFields.addressComplement,
  neighborhood: clientFields.neighborhood,
  phone: clientFields.phone,
  whatsApp: clientFields.whatsApp,
  email: clientFields.email,
  city: clientFields.city,
  state: clientFields.state,
  zipCode: clientFields.zipCode,
}).superRefine((value, context) => {
  if (value.cpfCnpj && value.type && !isValidClientDocument(value.cpfCnpj, value.type)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["cpfCnpj"], message: value.type === "PJ" ? "CNPJ inválido" : "CPF inválido" });
  }
});

// ============================================================
// PRODUCTS
// ============================================================
export const createProductSchema = z.object({
  code: z.string().trim().min(1, "Código inválido").max(64, "Código deve ter até 64 caracteres").regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Código deve conter apenas letras, números, ponto, hífen, barra ou sublinhado").optional().nullable(),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().optional().nullable(),
  thickness: z.string().min(1, "Espessura é obrigatória"),
  color: z.string().optional().nullable(),
  width: z.string().min(1, "Largura é obrigatória"),
  height: z.string().min(1, "Altura é obrigatória"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  stockQuantity: z.string().min(1, "Quantidade em estoque é obrigatória"),
  minStockQuantity: z.string().min(1, "Quantidade mínima é obrigatória"),
});

export const updateProductSchema = z.object({
  id: z.number().int().positive("ID do produto deve ser positivo"),
  code: z.string().trim().min(1, "Código inválido").max(64, "Código deve ter até 64 caracteres").regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Código deve conter apenas letras, números, ponto, hífen, barra ou sublinhado").optional().nullable(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  type: z.string().optional().nullable(),
  thickness: z.string().optional(),
  color: z.string().optional().nullable(),
  width: z.string().optional(),
  height: z.string().optional(),
  unitPrice: z.string().optional(),
  stockQuantity: z.string().optional(),
  minStockQuantity: z.string().optional(),
});

export const createProductTypeSchema = z.object({
  name: z.string().trim().min(2, "Nome do tipo deve ter ao menos 2 caracteres").max(120),
});

export const updateProductTypeSchema = createProductTypeSchema.extend({
  id: z.number().int().positive("ID do tipo deve ser positivo"),
});

// ============================================================
// SUPPLIERS
// ============================================================
export const createSupplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  paymentTerms: z.enum(["a_vista", "15_dias", "30_dias"]).default("a_vista"),
  notes: z.string().optional().nullable(),
});

export const updateSupplierSchema = z.object({
  id: z.number().int().positive("ID do fornecedor deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  cnpj: z.string().min(1, "CNPJ é obrigatório").optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  paymentTerms: z.enum(["a_vista", "15_dias", "30_dias"]).optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// QUOTES (Orçamentos)
// ============================================================
export const createQuoteSchema = z.object({
  clientId: z.number().int().positive("ID do cliente é obrigatório"),
  status: z.enum(["rascunho", "aprovado", "rejeitado", "convertido"]).default("rascunho"),
  validUntil: z.string().optional().nullable(),
  totalAmount: z.string().default("0"),
  discount: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateQuoteSchema = z.object({
  id: z.number().int().positive("ID do orçamento é obrigatório"),
  clientId: z.number().int().positive().optional(),
  status: z.enum(["rascunho", "aprovado", "rejeitado", "convertido"]).optional(),
  validUntil: z.string().optional().nullable(),
  totalAmount: z.string().optional(),
  discount: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// QUOTE ITEMS
// ============================================================
export const createQuoteItemSchema = z.object({
  quoteId: z.number().int().positive("ID do orçamento é obrigatório"),
  productId: z.number().int().positive("ID do produto é obrigatório"),
  width: positiveDecimalString("Largura em centímetros"),
  height: positiveDecimalString("Altura em centímetros"),
  quantity: positiveIntegerString("Quantidade"),
  unitPrice: positiveDecimalString("Preço por m²"),
  notes: z.string().optional().nullable(),
});

export const updateQuoteItemSchema = z.object({
  id: z.number().int().positive("ID do item é obrigatório"),
  width: positiveDecimalString("Largura em centímetros").optional(),
  height: positiveDecimalString("Altura em centímetros").optional(),
  quantity: positiveIntegerString("Quantidade").optional(),
  unitPrice: positiveDecimalString("Preço por m²").optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// ORDERS (Pedidos de Venda)
// ============================================================
export const createOrderSchema = z.object({
  clientId: z.number().int().positive("ID do cliente é obrigatório"),
  quoteId: z.number().int().positive().optional().nullable(),
  status: z.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).default("aprovado"),
  totalAmount: z.string().default("0"),
  notes: z.string().optional().nullable(),
});

export const updateOrderSchema = z.object({
  id: z.number().int().positive("ID do pedido é obrigatório"),
  clientId: z.number().int().positive().optional(),
  status: z.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).optional(),
  totalAmount: z.string().optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// ORDER ITEMS
// ============================================================
export const createOrderItemSchema = z.object({
  orderId: z.number().int().positive("ID do pedido é obrigatório"),
  productId: z.number().int().positive("ID do produto é obrigatório"),
  width: positiveDecimalString("Largura em centímetros"),
  height: positiveDecimalString("Altura em centímetros"),
  quantity: positiveIntegerString("Quantidade"),
  unitPrice: positiveDecimalString("Preço por m²"),
  notes: z.string().optional().nullable(),
});

export const updateOrderItemSchema = z.object({
  id: z.number().int().positive("ID do item é obrigatório"),
  width: positiveDecimalString("Largura em centímetros").optional(),
  height: positiveDecimalString("Altura em centímetros").optional(),
  quantity: positiveIntegerString("Quantidade").optional(),
  unitPrice: positiveDecimalString("Preço por m²").optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// COUNTER SALES (Venda Direta / Balcão)
// ============================================================
const counterTransactionItemsSchema = z.array(z.object({
  productId: z.number().int().positive("Selecione um produto"),
  width: positiveDecimalString("Largura em centímetros"),
  height: positiveDecimalString("Altura em centímetros"),
  quantity: positiveIntegerString("Quantidade"),
  unitPrice: positiveDecimalString("Preço por m²"),
  notes: z.string().trim().max(1000).optional().nullable(),
})).min(1, "Adicione pelo menos um item ao atendimento");

export const createCounterSaleSchema = z.object({
  clientId: z.number().int().positive("Selecione o cliente da venda"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: counterTransactionItemsSchema,
});

const counterCommercialExtrasSchema = z.array(z.object({
  kind: z.enum(["acessorio", "massa", "tarugo", "moldura", "montagem"]),
  description: z.string().trim().min(1, "Descrição do complemento é obrigatória").max(255),
  unit: z.enum(["un", "kg", "cm", "m", "servico"]),
  quantity: positiveDecimalString("Quantidade do complemento"),
  unitPrice: nonNegativeDecimalString("Preço unitário do complemento"),
  productId: z.number().int().positive().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})).default([]);

/** Fecha um atendimento de balcão como orçamento ou venda; o cliente é definido apenas no encerramento. */
export const finalizeCounterTransactionSchema = z.object({
  outcome: z.enum(["quote", "sale"]),
  clientId: z.number().int().positive("Selecione ou cadastre o cliente para concluir o atendimento"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: counterTransactionItemsSchema,
  extras: counterCommercialExtrasSchema,
});

// ============================================================
// PURCHASE ORDERS
// ============================================================
export const createPurchaseOrderSchema = z.object({
  supplierId: z.number().int().positive("ID do fornecedor é obrigatório"),
  status: z.enum(["pendente", "confirmado", "recebido", "cancelado"]).default("pendente"),
  totalAmount: z.string().default("0"),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePurchaseOrderSchema = z.object({
  id: z.number().int().positive("ID do pedido de compra é obrigatório"),
  supplierId: z.number().int().positive().optional(),
  status: z.enum(["pendente", "confirmado", "recebido", "cancelado"]).optional(),
  totalAmount: z.string().optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// PURCHASE ORDER ITEMS
// ============================================================
export const createPurchaseOrderItemSchema = z.object({
  purchaseOrderId: z.number().int().positive("ID do pedido de compra é obrigatório"),
  productId: z.number().int().positive("ID do produto é obrigatório"),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unitCost: z.string().min(1, "Custo unitário é obrigatório"),
  notes: z.string().optional().nullable(),
});

export const updatePurchaseOrderItemSchema = z.object({
  id: z.number().int().positive("ID do item é obrigatório"),
  quantity: z.string().optional(),
  unitCost: z.string().optional(),
  notes: z.string().optional().nullable(),
});

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export const createStockMovementSchema = z.object({
  productId: z.number().int().positive("ID do produto é obrigatório"),
  type: z.enum(["entrada", "saida"]),
  quantity: z.number().int().positive("Quantidade é obrigatória"),
  referenceType: z.string().optional().nullable(),
  referenceId: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateQuoteItemInput = z.infer<typeof createQuoteItemSchema>;
export type UpdateQuoteItemInput = z.infer<typeof updateQuoteItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type CreatePurchaseOrderItemInput = z.infer<typeof createPurchaseOrderItemSchema>;
export type UpdatePurchaseOrderItemInput = z.infer<typeof updatePurchaseOrderItemSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
