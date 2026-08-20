import { eq } from "drizzle-orm";
import { brandSettings } from "../../drizzle/schema";
import { updateBrandSettingsSchema } from "../../shared/schemas";
import { getDb } from "../db";
import { publicProcedure, router, superadminProcedure } from "../_core/trpc";

const DEFAULT_BRAND = {
  id: 1,
  displayName: "Sua Empresa",
  legalName: "Sua Empresa",
  tagline: "Sistema de gestão comercial",
  logoUrl: null,
  primaryColor: "#0f766e",
  phone: null,
  email: null,
  address: null,
};

export const brandSettingsRouter = router({
  get: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return DEFAULT_BRAND;
    const [brand] = await db.select().from(brandSettings).where(eq(brandSettings.id, 1)).limit(1);
    return brand ?? DEFAULT_BRAND;
  }),

  update: superadminProcedure.input(updateBrandSettingsSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const normalized = {
      ...input,
      legalName: input.legalName || null,
      tagline: input.tagline || null,
      logoUrl: input.logoUrl || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    };
    await db.insert(brandSettings).values({ id: 1, ...normalized }).onDuplicateKeyUpdate({ set: normalized });
    return { success: true };
  }),
});
