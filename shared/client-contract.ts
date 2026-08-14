import { formatClientDocument, formatPhone, formatZipCode, type ClientType } from "./client-identifiers";

export type ClientMutationForm = {
  name: string;
  type: ClientType;
  cpfCnpj: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/**
 * Normaliza os valores da tela antes de entregá-los ao contrato tRPC.
 * Os campos tipo e CPF/CNPJ permanecem explícitos porque são obrigatórios
 * na tabela de clientes e garantem que o servidor nunca receba undefined.
 */
export function toClientMutationInput(form: ClientMutationForm) {
  return {
    name: form.name.trim(),
    type: form.type,
    cpfCnpj: formatClientDocument(form.cpfCnpj, form.type),
    email: optionalText(form.email),
    phone: optionalText(formatPhone(form.phone)),
    address: optionalText(form.address),
    neighborhood: optionalText(form.neighborhood),
    city: optionalText(form.city),
    state: optionalText(form.state)?.toUpperCase(),
    zipCode: optionalText(formatZipCode(form.zipCode)),
  };
}
