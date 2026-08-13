const baseUrl = (process.env.VIDRIX_API_URL || "https://vidrix-erp-final.azurewebsites.net").replace(/\/$/, "");
const token = process.env.VIDRIX_ADMIN_TOKEN;

if (!token) throw new Error("VIDRIX_ADMIN_TOKEN is required");

async function query(path) {
  const input = encodeURIComponent(JSON.stringify({ json: null }));
  const response = await fetch(`${baseUrl}/api/trpc/${path}?input=${input}`, {
    headers: { authorization: `Bearer ${token}`, "trpc-accept": "application/json" },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${body.slice(0, 300)}`);
  return JSON.parse(body).result.data.json;
}

const [migration, clients, products] = await Promise.all([
  query("legacyMigration.status"),
  query("clients.list"),
  query("products.list"),
]);

function creationWindow(items) {
  const values = (Array.isArray(items) ? items : [])
    .map((item) => item?.createdAt)
    .filter(Boolean)
    .map((value) => String(value))
    .sort();
  return values.length ? { earliest: values[0], latest: values.at(-1) } : null;
}

function idWindow(items) {
  const values = (Array.isArray(items) ? items : [])
    .map((item) => Number(item?.id))
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((left, right) => left - right);
  return values.length ? { first: values[0], last: values.at(-1), contiguous: values.at(-1) - values[0] + 1 === values.length } : null;
}

console.log(JSON.stringify({
  archivedRows: migration.archivedRows,
  cuttingRules: migration.cuttingRules,
  clients: Array.isArray(clients) ? clients.length : 0,
  products: Array.isArray(products) ? products.length : 0,
  clientCreationWindow: creationWindow(clients),
  productCreationWindow: creationWindow(products),
  clientIdWindow: idWindow(clients),
  productIdWindow: idWindow(products),
}, null, 2));
