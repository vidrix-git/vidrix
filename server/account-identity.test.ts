import { describe, expect, it } from "vitest";
import { getAccountIdentity } from "../client/src/lib/account-identity";

describe("identidade da conta no rodapé", () => {
  it("não repete o e-mail quando ele também é o nome exibido", () => {
    expect(
      getAccountIdentity({ name: "admin@vidrix.local", email: "ADMIN@vidrix.local" }),
    ).toEqual({ primary: "ADMIN@vidrix.local" });
  });

  it("mantém nome e e-mail em linhas separadas quando são informações distintas", () => {
    expect(
      getAccountIdentity({ name: "Admin", email: "admin@vidrix.local" }),
    ).toEqual({ primary: "Admin", secondary: "admin@vidrix.local" });
  });
});
