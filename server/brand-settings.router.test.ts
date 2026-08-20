import { describe, expect, it, beforeEach, vi } from "vitest";
import { brandSettings } from "../drizzle/schema";

const { getDbMock, insertMock, valuesMock, onDuplicateKeyUpdateMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  insertMock: vi.fn(),
  valuesMock: vi.fn(),
  onDuplicateKeyUpdateMock: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: getDbMock }));

import { brandSettingsRouter } from "./routers/brandSettings";

function createCaller(role: "seller" | "admin" | "superadmin") {
  return brandSettingsRouter.createCaller({
    user: {
      id: 1,
      openId: `local:${role}`,
      name: role,
      email: `${role}@empresa.local`,
      role,
      loginMethod: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  });
}

const brandInput = {
  displayName: "Vidraçaria Exemplo",
  legalName: "Vidraçaria Exemplo Ltda.",
  tagline: "Gestão para vidraçarias",
  logoUrl: "",
  primaryColor: "#1D4ED8",
  phone: "(11) 99999-9999",
  email: "",
  address: "Rua Exemplo, 100",
};

describe("configuração white label", () => {
  beforeEach(() => {
    getDbMock.mockReset();
    insertMock.mockReset();
    valuesMock.mockReset();
    onDuplicateKeyUpdateMock.mockReset();
    insertMock.mockReturnValue({ values: valuesMock });
    valuesMock.mockReturnValue({ onDuplicateKeyUpdate: onDuplicateKeyUpdateMock });
    onDuplicateKeyUpdateMock.mockResolvedValue(undefined);
  });

  it("expõe uma identidade neutra quando a marca ainda não foi configurada", async () => {
    getDbMock.mockResolvedValue(null);

    await expect(createCaller("seller").get()).resolves.toMatchObject({
      id: 1,
      displayName: "Sua Empresa",
      primaryColor: "#0f766e",
    });
  });

  it("bloqueia a alteração de marca por Vendedor e Administrador", async () => {
    await expect(createCaller("seller").update(brandInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createCaller("admin").update(brandInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite ao Superadministrador atualizar a configuração única e normaliza campos vazios", async () => {
    getDbMock.mockResolvedValue({ insert: insertMock });

    await expect(createCaller("superadmin").update(brandInput)).resolves.toEqual({ success: true });

    const normalized = {
      displayName: "Vidraçaria Exemplo",
      legalName: "Vidraçaria Exemplo Ltda.",
      tagline: "Gestão para vidraçarias",
      logoUrl: null,
      primaryColor: "#1D4ED8",
      phone: "(11) 99999-9999",
      email: null,
      address: "Rua Exemplo, 100",
    };
    expect(insertMock).toHaveBeenCalledWith(brandSettings);
    expect(valuesMock).toHaveBeenCalledWith({ id: 1, ...normalized });
    expect(onDuplicateKeyUpdateMock).toHaveBeenCalledWith({ set: normalized });
  });
});
