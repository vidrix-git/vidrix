import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: getDbMock,
}));

import { hashPassword, localLogin, verifyToken } from "./local-auth";

describe("login local de superadmin", () => {
  beforeEach(() => {
    const password = "senha-temporaria-segura";
    const record = {
      id: 9,
      openId: "local:superadmin",
      name: "Superadmin",
      email: "superadmin@vidrix.local",
      role: "superadmin",
      loginMethod: "local",
      password: hashPassword(password),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const query = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([record]),
        }),
      }),
    };

    getDbMock.mockReset();
    getDbMock.mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue(query),
    });
  });

  it("autentica o superadmin e preserva o papel na sessão JWT", async () => {
    const result = await localLogin("superadmin", "senha-temporaria-segura");

    expect(result?.user.role).toBe("superadmin");
    expect(result?.token).toBeTruthy();
    await expect(verifyToken(result!.token)).resolves.toMatchObject({
      userId: 9,
      name: "Superadmin",
      role: "superadmin",
    });
  });
});
