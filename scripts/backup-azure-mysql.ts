import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createConnection, type RowDataPacket } from "mysql2/promise";

const backupDirectory = process.env.BACKUP_DIRECTORY || "/home/ubuntu/azure-backups";
const tables = [
  "users", "clients", "products", "suppliers", "quotes", "quoteItems", "orders", "orderItems",
  "purchaseOrders", "purchaseOrderItems", "stockMovements", "legacyImportRecords", "cuttingRules",
];

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const connection = await createConnection(process.env.DATABASE_URL);
  try {
    const snapshot: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      database: "Azure MySQL production before MDB import",
      tables: {},
    };

    for (const table of tables) {
      const [exists] = await connection.execute<RowDataPacket[]>("SHOW TABLES LIKE ?", [table]);
      if (!exists.length) continue;
      const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM \`${table}\``);
      (snapshot.tables as Record<string, unknown>)[table] = rows;
    }

    await mkdir(backupDirectory, { recursive: true, mode: 0o700 });
    const file = join(backupDirectory, `vidrix-before-mdb-import-${Date.now()}.json`);
    await writeFile(file, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
    console.log(file);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Azure database backup failed:", error);
  process.exitCode = 1;
});
