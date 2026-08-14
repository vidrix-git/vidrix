import { protectedProcedure, router } from "../_core/trpc";
import { createClientSchema, updateClientSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { digitsOnly, formatZipCode } from "../../shared/client-identifiers";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export const clientsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(clients).orderBy(clients.createdAt);
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(clients).where(eq(clients.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Cliente não encontrado");
    return result[0];
  }),

  lookupCep: protectedProcedure.input(z.object({ zipCode: z.string() })).mutation(async ({ input }) => {
    const zipCode = digitsOnly(input.zipCode);
    if (zipCode.length !== 8) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "CEP deve ter 8 dígitos" });
    }

    let response: Response;
    try {
      response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Não foi possível consultar o CEP agora" });
    }

    if (!response.ok) {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "O serviço de CEP não respondeu corretamente" });
    }

    const address = await response.json() as ViaCepResponse;
    if (address.erro) {
      throw new TRPCError({ code: "NOT_FOUND", message: "CEP não encontrado" });
    }

    return {
      zipCode: formatZipCode(address.cep || zipCode),
      address: address.logradouro || "",
      neighborhood: address.bairro || "",
      city: address.localidade || "",
      state: (address.uf || "").toUpperCase(),
    };
  }),

  create: protectedProcedure.input(createClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(clients).values(opts.input);
    return { success: true, insertId: result[0].insertId };
  }),

  update: protectedProcedure.input(updateClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(clients).set(data).where(eq(clients.id, id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(clients).where(eq(clients.id, opts.input.id));
    return { success: true };
  }),
});
