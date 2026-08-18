export const LOCAL_TOKEN_STORAGE_KEY = "vidrix-token";

/**
 * Builds the optional Authorization header used when an embedded or hardened
 * browser does not retain the secure session cookie after the local login.
 */
export function getLocalSessionAuthorization(token: string | null | undefined): Record<string, string> {
  const normalizedToken = token?.trim();
  return normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {};
}
