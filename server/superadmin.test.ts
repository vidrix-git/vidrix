import { beforeEach, describe, expect, it, vi } from "vitest";

const { localRegisterMock } = vi.hoisted(() => ({
  localRegisterMock: vi.fn(),
}));

vi.mock("./local-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./local-auth")>();
  return {
    ...actual,
    localRegister: localRegisterMock,
  };
});

import { appRouter } from "./routers";

function createCaller(role: "user" | "admin" | "superadmin") {
  return appRouter.createCaller({
    user: {
      id: 1,
      openId: `local:${role}`,
      name: role,
      email: `${role}@vidrix.local`,
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

describe("criação de superadmin", () => {
  beforeEach(() => {
    localRegisterMock.mockReset();
    localRegisterMock.mockResolvedValue({
      user: {
        id: 2,
        openId: "local:superadmin",
        name: "Superadmin",
        email: "superadmin@vidrix.local",
        role: "superadmin",
      },
      token: "token-de-teste",
    });
  });

  it("bloqueia a criação por um utilizador comum", async () => {
    await expect(
      createCaller("user").auth.createSuperadmin({
        username: "superadmin",
        password: "senha-temporaria-segura",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(localRegisterMock).not.toHaveBeenCalled();
  });

  it("permite que um administrador crie apenas o papel superadmin", async () => {
    const result = await createCaller("admin").auth.createSuperadmin({
      username: "superadmin",
      password: "senha-temporaria-segura",
    });

    expect(localRegisterMock).toHaveBeenCalledWith(
      "superadmin",
      "superadmin@vidrix.local",
      "senha-temporaria-segura",
      "superadmin"
    );
    expect(result.user.role).toBe("superadmin");
  });

  it("permite que um superadmin crie outro superadmin", async () => {
    const result = await createCaller("superadmin").auth.createSuperadmin({
      username: "supervisor",
      password: "senha-temporaria-segura",
      email: "supervisor@vidrix.local",
    });

    expect(localRegisterMock).toHaveBeenCalledWith(
      "supervisor",
      "supervisor@vidrix.local",
      "senha-temporaria-segura",
      "superadmin"
    );
    expect(result.success).toBe(true);
  });
});
