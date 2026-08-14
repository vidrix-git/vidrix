import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { clients, cuttingRules, legacyImportRecords, products } from "../../drizzle/schema";
import { ensureDatabaseSchema, getDb } from "../db";
import { extractSqlCount, legacyCodeFor, legacyRowHash, mapLegacyClient, mapLegacyCuttingRule, mapLegacyProduct, type LegacyRow } from "../legacy-migration";
import { adminProcedure, router } from "../_core/trpc";

const supportedTables = [
  "15 Dias", "30 Dias", "A_vista", "AcessoriosRevendaCadastro", "Box canto", "Box Frontal", "Colocado", "Cortado",
  "Erros ao colar", "KIt_Fontal", "Larguras", "Larguras Box", "Larguras2 Box", "Revenda", "tabelapercentual", "TempBox",
  "Venda", "Alturas", "Kit_Canto", "Massa Peso",
] as const;

const sourceTableSchema = z.enum(supportedTables);
const sourceRowSchema = z.object({
  sourceTable: sourceTableSchema,
  row: z.record(z.string(), z.string()),
});

function recordType(sourceTable: string): string {
  if (sourceTable === "Venda") return "venda_historica";
  if (sourceTable === "TempBox") return "rascunho_box";
  return "linha_legada";
}

function isRuleTable(sourceTable: string): sourceTable is "Larguras" | "Larguras Box" | "Larguras2 Box" | "Alturas" {
  return sourceTable === "Larguras" || sourceTable === "Larguras Box" || sourceTable === "Larguras2 Box" || sourceTable === "Alturas";
}

export const legacyMigrationRouter = router({
  status: adminProcedure.query(async () => {
    await ensureDatabaseSchema();
    const db = await getDb();
    if (!db) throw new Error("Database connection is not configured");

    const [archiveRows] = await db.execute(sql`SELECT COUNT(*) AS count FROM ${legacyImportRecords}`);
    const [ruleRows] = await db.execute(sql`SELECT COUNT(*) AS count FROM ${cuttingRules}`);
    const [clientRows] = await db.execute(sql`SELECT COUNT(*) AS count FROM ${clients}`);
    const [productRows] = await db.execute(sql`SELECT COUNT(*) AS count FROM ${products}`);
    return {
      archivedRows: extractSqlCount(archiveRows),
      cuttingRules: extractSqlCount(ruleRows),
      clients: extractSqlCount(clientRows),
      products: extractSqlCount(productRows),
    };
  }),

  importBatch: adminProcedure
    .input(z.object({ rows: z.array(sourceRowSchema).min(1).max(200) }))
    .mutation(async ({ input }) => {
      await ensureDatabaseSchema();
      const db = await getDb();
      if (!db) throw new Error("Database connection is not configured");

      const entries = input.rows.map((inputRow) => {
        const sourceTable = inputRow.sourceTable;
        const row = inputRow.row as LegacyRow;
        return {
          sourceTable,
          row,
          sourceHash: legacyRowHash(sourceTable, row),
          archive: {
            sourceTable,
            sourceHash: legacyRowHash(sourceTable, row),
            recordType: recordType(sourceTable),
            legacyCode: legacyCodeFor(sourceTable, row),
            payload: JSON.stringify(row),
          },
        };
      });

      return db.transaction(async (tx) => {
        let clientsProcessed = 0;
        let productsProcessed = 0;
        const rules = entries.flatMap((entry) => {
          if (!isRuleTable(entry.sourceTable)) return [];
          const rule = mapLegacyCuttingRule(entry.row, entry.sourceTable);
          return rule ? [{ ...rule, cutValue: rule.cutValue.toFixed(2), saleValue: rule.saleValue.toFixed(2) }] : [];
        });

        for (const entry of entries.filter((entry) => entry.sourceTable === "Erros ao colar")) {
          const client = mapLegacyClient(entry.row);
          if (!client) continue;
          await tx.insert(clients).values(client).onDuplicateKeyUpdate({
            set: {
              name: sql`VALUES(name)`, type: sql`VALUES(type)`, address: sql`VALUES(address)`,
              phone: sql`VALUES(phone)`, updatedAt: sql`NOW()`,
            },
          });
          clientsProcessed += 1;
        }

        for (const entry of entries.filter((entry) => entry.sourceTable === "KIt_Fontal" || entry.sourceTable === "Kit_Canto")) {
          const product = mapLegacyProduct(entry.row, entry.sourceTable as "KIt_Fontal" | "Kit_Canto");
          if (!product) continue;
          const [knownRows] = await tx.execute(sql`
            SELECT id, code FROM ${products}
            WHERE ${products.name} = ${product.name} AND ${products.type} = ${product.type}
            LIMIT 1
          `);
          const existingProducts = knownRows as unknown as Array<{ id: number; code?: string | null }>;
          if (existingProducts.length > 0) {
            if (product.code && !existingProducts[0].code) {
              await tx.update(products).set({ code: product.code }).where(eq(products.id, existingProducts[0].id));
              productsProcessed += 1;
            }
            continue;
          }
          await tx.insert(products).values({
            ...product,
            width: product.width.toFixed(2), height: product.height.toFixed(2), unitPrice: product.unitPrice.toFixed(2),
          });
          productsProcessed += 1;
        }

        if (rules.length) {
          await tx.insert(cuttingRules).values(rules).onDuplicateKeyUpdate({
            set: { saleValue: sql`VALUES(saleValue)` },
          });
        }

        const result = await tx.insert(legacyImportRecords).values(entries.map((entry) => entry.archive)).onDuplicateKeyUpdate({
          set: { sourceHash: sql`VALUES(sourceHash)` },
        });
        return {
          received: input.rows.length,
          clientsProcessed,
          productsProcessed,
          rulesProcessed: rules.length,
          archivedRows: result[0].affectedRows,
        };
      });
    }),
});
