/**
 * Production server entrypoint for Azure App Service.
 * This file does NOT import vite or any dev dependencies.
 * It only imports the production-bundled modules.
 */
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import serveStatic from _core/vite but we need to avoid vite imports
// So we inline the static serving logic here
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

// Serve static files from the public directory
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(publicPath, "index.html"));
});

const port = parseInt(process.env.PORT || "80");
server.listen(port, () => {
  console.log(`Vidrix ERP running on http://localhost:${port}/`);
});
