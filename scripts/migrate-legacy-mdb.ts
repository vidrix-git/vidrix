import { execFileSync } from "node:child_process";
import type { LegacyRow } from "../server/legacy-migration";

const MDB_FILE = process.env.LEGACY_MDB_FILE || "/home/ubuntu/upload/Vidracaria2026pdv.mdb";
const APPLY = process.argv.includes("--apply");
const API_URL = (process.env.VIDRIX_API_URL || "https://vidrix-erp-final.azurewebsites.net").replace(/\/$/, "");
const ADMIN_TOKEN = process.env.VIDRIX_ADMIN_TOKEN;
const BATCH_SIZE = 200;

const tableNames = [
  "15 Dias", "30 Dias", "A_vista", "AcessoriosRevendaCadastro", "Box canto", "Box Frontal", "Colocado", "Cortado",
  "Erros ao colar", "KIt_Fontal", "Larguras", "Larguras Box", "Larguras2 Box", "Revenda", "tabelapercentual", "TempBox",
  "Venda", "Alturas", "Kit_Canto", "Massa Peso",
] as const;

const tableFilter = process.argv.find((argument) => argument.startsWith("--tables="));
const requestedTables = tableFilter
  ? tableFilter.slice("--tables=".length).split(",").map((tableName) => tableName.trim()).filter(Boolean)
  : null;
const selectedTables = requestedTables
  ? tableNames.filter((tableName) => requestedTables.includes(tableName))
  : tableNames;

if (requestedTables && selectedTables.length !== requestedTables.length) {
  const unknownTables = requestedTables.filter((tableName) => !tableNames.includes(tableName as (typeof tableNames)[number]));
  throw new Error(`Unknown legacy table(s): ${unknownTables.join(", ")}`);
}

type ImportResult = {
  received: number;
  clientsProcessed: number;
  productsProcessed: number;
  rulesProcessed: number;
  archivedRows: number;
};

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (character === "\n" && !quoted) {
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function readTable(tableName: string): LegacyRow[] {
  const csv = execFileSync("mdb-export", [MDB_FILE, tableName], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  const [headers, ...rows] = parseCsv(csv);
  if (!headers) return [];
  return rows.map((fields) => Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? ""])));
}

async function importBatch(rows: Array<{ sourceTable: string; row: LegacyRow }>): Promise<ImportResult> {
  const response = await fetch(`${API_URL}/api/trpc/legacyMigration.importBatch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ json: { rows } }),
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`Import batch failed (${response.status}): ${responseText.slice(0, 500)}`);

  const parsed = JSON.parse(responseText) as { result?: { data?: { json?: ImportResult } } };
  const result = parsed.result?.data?.json;
  if (!result) throw new Error("Import batch returned an invalid tRPC response");
  return result;
}

async function main(): Promise<void> {
  const sourceRows = Object.fromEntries(selectedTables.map((tableName) => [tableName, readTable(tableName)])) as Record<string, LegacyRow[]>;
  const totalRows = Object.values(sourceRows).reduce((total, rows) => total + rows.length, 0);
  const summary = {
    mode: APPLY ? "apply" : "dry-run",
    tables: selectedTables,
    totalRows,
    clients: sourceRows["Erros ao colar"]?.length ?? 0,
    products: (sourceRows.KIt_Fontal?.length ?? 0) + (sourceRows.Kit_Canto?.length ?? 0),
    cuttingRules: (sourceRows.Larguras?.length ?? 0) + (sourceRows["Larguras Box"]?.length ?? 0) + (sourceRows["Larguras2 Box"]?.length ?? 0) + (sourceRows.Alturas?.length ?? 0),
    historicalRows: totalRows,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!APPLY) return;
  if (!ADMIN_TOKEN) throw new Error("VIDRIX_ADMIN_TOKEN is required with --apply");

  const totals: ImportResult = { received: 0, clientsProcessed: 0, productsProcessed: 0, rulesProcessed: 0, archivedRows: 0 };
  for (const sourceTable of selectedTables) {
    const rows = sourceRows[sourceTable];
    for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
      const batch = rows.slice(offset, offset + BATCH_SIZE).map((row) => ({ sourceTable, row }));
      const result = await importBatch(batch);
      totals.received += result.received;
      totals.clientsProcessed += result.clientsProcessed;
      totals.productsProcessed += result.productsProcessed;
      totals.rulesProcessed += result.rulesProcessed;
      totals.archivedRows += result.archivedRows;
      console.log(`[${sourceTable}] ${Math.min(offset + batch.length, rows.length)}/${rows.length}`);
    }
  }

  console.log(JSON.stringify({ target: API_URL, ...totals }, null, 2));
}

main().catch((error) => {
  console.error("Legacy MDB migration failed:", error);
  process.exitCode = 1;
});
