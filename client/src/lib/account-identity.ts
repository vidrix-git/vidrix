export type AccountIdentitySource = {
  name?: string | null;
  email?: string | null;
};

export type AccountIdentity = {
  primary: string;
  secondary?: string;
};

function normalizedIdentity(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, "")
    .toLocaleLowerCase();
}

/**
 * Produz as duas linhas do perfil sem repetir o e-mail quando ele também foi
 * armazenado como nome de exibição da conta. A comparação também ignora
 * caracteres invisíveis e variações de Unicode trazidas por dados legados.
 */
export function getAccountIdentity(user?: AccountIdentitySource | null): AccountIdentity {
  const name = user?.name?.trim() ?? "";
  const email = user?.email?.trim() ?? "";

  if (name && (!email || normalizedIdentity(name) !== normalizedIdentity(email))) {
    return { primary: name, secondary: email || undefined };
  }

  return { primary: email || name || "Conta local" };
}
