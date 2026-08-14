export type ClientMutationForm = {
  name: string;
  type: "PF" | "PJ";
  cpfCnpj: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
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
    cpfCnpj: form.cpfCnpj.trim(),
    email: optionalText(form.email),
    phone: optionalText(form.phone),
    address: optionalText(form.address),
    city: optionalText(form.city),
  };
}
