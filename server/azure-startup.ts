/**
 * Azure App Service startup entrypoint.
 * Renamed from production-server to avoid confusion.
 */
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ensureDatabaseSchema } from "./db";
import { ensureDefaultAdmin } from "./local-auth";
import path from "path";

const app = express();
const server = createServer(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const publicPath = path.resolve(process.cwd(), "public");
app.use(express.static(publicPath));
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(publicPath, "index.html"));
});

// Azure sets PORT env var. If not set, default to 80.
const port = parseInt(process.env.PORT || "80");

async function startAzureServer() {
  try {
    await ensureDatabaseSchema();
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("[Database] Startup initialization failed:", error);
  }

  server.listen(port, () => {
    console.log(`Vidrix ERP running on port ${port}`);
  });
}

startAzureServer().catch(console.error);
