const baseUrl = (process.env.VIDRIX_API_URL || "https://vidrix-erp-final.azurewebsites.net").replace(/\/$/, "");
const token = process.env.VIDRIX_ADMIN_TOKEN;

if (!token) {
  throw new Error("VIDRIX_ADMIN_TOKEN is required");
}

const input = encodeURIComponent(JSON.stringify({ json: null }));
const response = await fetch(`${baseUrl}/api/trpc/legacyMigration.status?input=${input}`, {
  headers: {
    authorization: `Bearer ${token}`,
    "trpc-accept": "application/json",
  },
});
const body = await response.text();
if (!response.ok) {
  throw new Error(`Migration status request failed (${response.status}): ${body.slice(0, 500)}`);
}

console.log(body);
