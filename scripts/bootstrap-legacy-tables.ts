import { createConnection } from "mysql2/promise";

const statements = [
  `CREATE TABLE IF NOT EXISTS \`legacyImportRecords\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sourceTable\` varchar(100) NOT NULL,
    \`sourceHash\` varchar(64) NOT NULL,
    \`recordType\` varchar(64) NOT NULL,
    \`legacyCode\` varchar(100),
    \`payload\` text NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`legacy_import_source_hash_unique\` (\`sourceTable\`, \`sourceHash\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`cuttingRules\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`category\` varchar(32) NOT NULL,
    \`cutValue\` decimal(10,2) NOT NULL,
    \`saleValue\` decimal(10,2) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY(\`id\`),
    UNIQUE KEY \`cutting_rules_category_cut_unique\` (\`category\`, \`cutValue\`)
  )`,
];

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const connection = await createConnection(process.env.DATABASE_URL);
  try {
    for (const statement of statements) await connection.execute(statement);
    console.log("Legacy migration tables are ready");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Legacy table bootstrap failed:", error);
  process.exitCode = 1;
});
