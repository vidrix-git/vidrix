import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não foi fornecida.");
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [columns] = await connection.query("SHOW COLUMNS FROM users");
  const [users] = await connection.query(
    "SELECT id, name, email, role, password IS NOT NULL AS hasPassword FROM users ORDER BY id LIMIT 10"
  );

  console.log(
    JSON.stringify(
      {
        columns: columns.map((column) => column.Field),
        users,
      },
      null,
      2
    )
  );
} finally {
  await connection.end();
}
