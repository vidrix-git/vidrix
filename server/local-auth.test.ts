import { describe, expect, it } from "vitest";
import {
  isDuplicatePasswordColumnError,
  isPrivilegedRole,
  matchesBootstrapAdminPassword,
  verifyPassword,
} from "./local-auth";

describe("autenticação local", () => {
  it("aceita a senha de arranque configurada para um administrador herdado sem hash", () => {
    expect(matchesBootstrapAdminPassword("admin123", "admin123")).toBe(true);
  });

  it("rejeita uma senha de arranque incorreta", () => {
    expect(matchesBootstrapAdminPassword("incorreta", "admin123")).toBe(false);
  });

  it("rejeita valores que não estejam no formato PBKDF2 armazenado", () => {
    expect(verifyPassword("admin123", "admin123")).toBe(false);
  });

  it("reconhece um erro MySQL de coluna password já existente mesmo quando encapsulado", () => {
    const mysqlError = Object.assign(new Error("Failed query"), {
      cause: {
        code: "ER_DUP_FIELDNAME",
        sqlMessage: "Duplicate column name 'password'",
      },
    });

    expect(isDuplicatePasswordColumnError(mysqlError)).toBe(true);
  });

  it("trata superadmin e admin como papéis administrativos", () => {
    expect(isPrivilegedRole("admin")).toBe(true);
    expect(isPrivilegedRole("superadmin")).toBe(true);
    expect(isPrivilegedRole("user")).toBe(false);
  });
});
