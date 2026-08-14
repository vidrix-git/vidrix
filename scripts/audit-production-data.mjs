const baseUrl = (process.env.VIDRIX_API_URL || "https://vidrix-erp-final.azurewebsites.net").replace(/\/$/, "");
const username = process.env.VIDRIX_USERNAME;
const password = process.env.VIDRIX_PASSWORD;

if (!username || !password) {
  throw new Error("VIDRIX_USERNAME e VIDRIX_PASSWORD são obrigatórios para a auditoria autenticada.");
}

async function parseTrpcResponse(response, endpoint) {
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.result?.data?.json) {
    throw new Error(`${endpoint} falhou com HTTP ${response.status}.`);
  }
  return body.result.data.json;
}

async function login() {
  const response = await fetch(`${baseUrl}/api/trpc/auth.login`, {
    method: "POST",
    headers: { "content-type": "application/json", "trpc-accept": "application/json" },
    body: JSON.stringify({ json: { username, password } }),
  });
  const result = await parseTrpcResponse(response, "auth.login");
  if (!result?.token) throw new Error("auth.login não devolveu um token de sessão.");
  return result.token;
}

async function query(endpoint, token) {
  const input = encodeURIComponent(JSON.stringify({ json: null }));
  const response = await fetch(`${baseUrl}/api/trpc/${endpoint}?input=${input}`, {
    headers: { authorization: `Bearer ${token}`, "trpc-accept": "application/json" },
  });
  return parseTrpcResponse(response, endpoint);
}

function idWindow(rows) {
  const ids = rows.map((row) => Number(row?.id)).filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
  return ids.length ? { first: ids[0], last: ids.at(-1), contiguous: ids.at(-1) - ids[0] + 1 === ids.length } : null;
}

function creationWindow(rows) {
  const timestamps = rows.map((row) => row?.createdAt ? new Date(row.createdAt).toISOString() : null).filter(Boolean).sort();
  return timestamps.length ? { earliest: timestamps[0], latest: timestamps.at(-1) } : null;
}

const token = await login();
const [migration, clients, products, orders, quotes] = await Promise.all([
  query("legacyMigration.status", token),
  query("clients.list", token),
  query("products.list", token),
  query("orders.list", token),
  query("quotes.list", token),
]);

console.log(JSON.stringify({
  endpoint: baseUrl,
  migration: { archivedRows: migration.archivedRows, cuttingRules: migration.cuttingRules },
  clients: { count: clients.length, idWindow: idWindow(clients), creationWindow: creationWindow(clients) },
  products: { count: products.length, idWindow: idWindow(products), creationWindow: creationWindow(products) },
  orders: { count: orders.length, statuses: orders.reduce((acc, order) => ({ ...acc, [order.status]: (acc[order.status] || 0) + 1 }), {}) },
  quotes: { count: quotes.length, statuses: quotes.reduce((acc, quote) => ({ ...acc, [quote.status]: (acc[quote.status] || 0) + 1 }), {}) },
}, null, 2));
