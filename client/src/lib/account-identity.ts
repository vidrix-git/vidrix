export type AccountIdentitySource = {
  name?: string | null;
  email?: string | null;
};

export type AccountIdentity = {
  primary: string;
  secondary?: string;
};

/**
 * Produz as duas linhas do perfil sem repetir o e-mail quando ele também foi
 * armazenado como nome de exibição da conta.
 */
export function getAccountIdentity(user?: AccountIdentitySource | null): AccountIdentity {
  const name = user?.name?.trim() ?? "";
  const email = user?.email?.trim() ?? "";

  if (name && (!email || name.toLocaleLowerCase() !== email.toLocaleLowerCase())) {
    return { primary: name, secondary: email || undefined };
  }

  return { primary: email || name || "Conta local" };
}
