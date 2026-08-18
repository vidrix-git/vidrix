import { describe, expect, it } from "vitest";
import {
  getLocalSessionAuthorization,
  LOCAL_TOKEN_STORAGE_KEY,
} from "../client/src/lib/auth-session";

describe("fallback de sessão local", () => {
  it("mantém a chave de armazenamento estável para o token JWT local", () => {
    expect(LOCAL_TOKEN_STORAGE_KEY).toBe("vidrix-token");
  });

  it("gera Authorization Bearer para um token persistido", () => {
    expect(getLocalSessionAuthorization("token-jwt-local")).toEqual({
      Authorization: "Bearer token-jwt-local",
    });
  });

  it("não gera cabeçalho para token ausente ou em branco", () => {
    expect(getLocalSessionAuthorization(null)).toEqual({});
    expect(getLocalSessionAuthorization("   ")).toEqual({});
  });
});
