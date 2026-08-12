// server/azure-startup.ts
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["PF", "PJ"]).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 255 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 255 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }),
  thickness: varchar("thickness", { length: 255 }).notNull(),
  color: varchar("color", { length: 255 }),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  minStockQuantity: int("minStockQuantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 255 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 255 }),
  email: varchar("email", { length: 255 }),
  paymentTerms: mysqlEnum("paymentTerms", ["a_vista", "15_dias", "30_dias"]).default("a_vista").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["rascunho", "aprovado", "rejeitado", "convertido"]).default("rascunho").notNull(),
  validUntil: timestamp("validUntil"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var quoteItems = mysqlTable("quoteItems", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  productId: int("productId").notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  squareMeters: decimal("squareMeters", { precision: 10, scale: 4 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  quoteId: int("quoteId"),
  status: mysqlEnum("status", ["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).default("aprovado").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  squareMeters: decimal("squareMeters", { precision: 10, scale: 4 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pendente", "confirmado", "recebido", "cancelado"]).default("pendente").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["entrada", "saida"]).notNull(),
  quantity: int("quantity").notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes),
  orders: many(orders)
}));
var usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  orders: many(orders),
  purchaseOrders: many(purchaseOrders)
}));
var productsRelations = relations(products, ({ many }) => ({
  quoteItems: many(quoteItems),
  orderItems: many(orderItems),
  purchaseOrderItems: many(purchaseOrderItems),
  stockMovements: many(stockMovements)
}));
var suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders)
}));
var quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, { fields: [quotes.clientId], references: [clients.id] }),
  user: one(users, { fields: [quotes.userId], references: [users.id] }),
  items: many(quoteItems),
  order: one(orders)
}));
var quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
  product: one(products, { fields: [quoteItems.productId], references: [products.id] })
}));
var ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  quote: one(quotes, { fields: [orders.quoteId], references: [quotes.id] }),
  items: many(orderItems)
}));
var orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] })
}));
var purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [purchaseOrders.userId], references: [users.id] }),
  items: many(purchaseOrderItems)
}));
var purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] })
}));
var stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] })
}));

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// shared/schemas.ts
import { z as z2 } from "zod";
var createClientSchema = z2.object({
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  type: z2.enum(["PF", "PJ"]),
  cpfCnpj: z2.string().min(1, "CPF/CNPJ \xE9 obrigat\xF3rio"),
  address: z2.string().optional().nullable(),
  phone: z2.string().optional().nullable(),
  email: z2.string().email("Email inv\xE1lido").optional().nullable()
});
var updateClientSchema = z2.object({
  id: z2.number().int().positive("ID do cliente deve ser positivo"),
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  type: z2.enum(["PF", "PJ"]).optional(),
  cpfCnpj: z2.string().min(1, "CPF/CNPJ \xE9 obrigat\xF3rio").optional(),
  address: z2.string().optional().nullable(),
  phone: z2.string().optional().nullable(),
  email: z2.string().email("Email inv\xE1lido").optional().nullable()
});
var createProductSchema = z2.object({
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  type: z2.string().optional().nullable(),
  thickness: z2.string().min(1, "Espessura \xE9 obrigat\xF3ria"),
  color: z2.string().optional().nullable(),
  width: z2.string().min(1, "Largura \xE9 obrigat\xF3ria"),
  height: z2.string().min(1, "Altura \xE9 obrigat\xF3ria"),
  unitPrice: z2.string().min(1, "Pre\xE7o unit\xE1rio \xE9 obrigat\xF3rio"),
  stockQuantity: z2.string().min(1, "Quantidade em estoque \xE9 obrigat\xF3ria"),
  minStockQuantity: z2.string().min(1, "Quantidade m\xEDnima \xE9 obrigat\xF3ria")
});
var updateProductSchema = z2.object({
  id: z2.number().int().positive("ID do produto deve ser positivo"),
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  type: z2.string().optional().nullable(),
  thickness: z2.string().optional(),
  color: z2.string().optional().nullable(),
  width: z2.string().optional(),
  height: z2.string().optional(),
  unitPrice: z2.string().optional(),
  stockQuantity: z2.string().optional(),
  minStockQuantity: z2.string().optional()
});
var createSupplierSchema = z2.object({
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
  cnpj: z2.string().min(1, "CNPJ \xE9 obrigat\xF3rio"),
  address: z2.string().optional().nullable(),
  phone: z2.string().optional().nullable(),
  email: z2.string().email("Email inv\xE1lido").optional().nullable(),
  paymentTerms: z2.enum(["a_vista", "15_dias", "30_dias"]).default("a_vista"),
  notes: z2.string().optional().nullable()
});
var updateSupplierSchema = z2.object({
  id: z2.number().int().positive("ID do fornecedor deve ser positivo"),
  name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
  cnpj: z2.string().min(1, "CNPJ \xE9 obrigat\xF3rio").optional(),
  address: z2.string().optional().nullable(),
  phone: z2.string().optional().nullable(),
  email: z2.string().email("Email inv\xE1lido").optional().nullable(),
  paymentTerms: z2.enum(["a_vista", "15_dias", "30_dias"]).optional(),
  notes: z2.string().optional().nullable()
});
var createQuoteSchema = z2.object({
  clientId: z2.number().int().positive("ID do cliente \xE9 obrigat\xF3rio"),
  status: z2.enum(["rascunho", "aprovado", "rejeitado", "convertido"]).default("rascunho"),
  validUntil: z2.string().optional().nullable(),
  totalAmount: z2.string().default("0"),
  discount: z2.string().optional().nullable(),
  notes: z2.string().optional().nullable()
});
var updateQuoteSchema = z2.object({
  id: z2.number().int().positive("ID do or\xE7amento \xE9 obrigat\xF3rio"),
  clientId: z2.number().int().positive().optional(),
  status: z2.enum(["rascunho", "aprovado", "rejeitado", "convertido"]).optional(),
  validUntil: z2.string().optional().nullable(),
  totalAmount: z2.string().optional(),
  discount: z2.string().optional().nullable(),
  notes: z2.string().optional().nullable()
});
var createQuoteItemSchema = z2.object({
  quoteId: z2.number().int().positive("ID do or\xE7amento \xE9 obrigat\xF3rio"),
  productId: z2.number().int().positive("ID do produto \xE9 obrigat\xF3rio"),
  width: z2.string().min(1, "Largura \xE9 obrigat\xF3ria"),
  height: z2.string().min(1, "Altura \xE9 obrigat\xF3ria"),
  quantity: z2.string().min(1, "Quantidade \xE9 obrigat\xF3ria"),
  unitPrice: z2.string().min(1, "Pre\xE7o unit\xE1rio \xE9 obrigat\xF3rio"),
  notes: z2.string().optional().nullable()
});
var updateQuoteItemSchema = z2.object({
  id: z2.number().int().positive("ID do item \xE9 obrigat\xF3rio"),
  width: z2.string().optional(),
  height: z2.string().optional(),
  quantity: z2.string().optional(),
  unitPrice: z2.string().optional(),
  notes: z2.string().optional().nullable()
});
var createOrderSchema = z2.object({
  clientId: z2.number().int().positive("ID do cliente \xE9 obrigat\xF3rio"),
  quoteId: z2.number().int().positive().optional().nullable(),
  status: z2.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).default("aprovado"),
  totalAmount: z2.string().default("0"),
  notes: z2.string().optional().nullable()
});
var updateOrderSchema = z2.object({
  id: z2.number().int().positive("ID do pedido \xE9 obrigat\xF3rio"),
  clientId: z2.number().int().positive().optional(),
  status: z2.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]).optional(),
  totalAmount: z2.string().optional(),
  notes: z2.string().optional().nullable()
});
var createOrderItemSchema = z2.object({
  orderId: z2.number().int().positive("ID do pedido \xE9 obrigat\xF3rio"),
  productId: z2.number().int().positive("ID do produto \xE9 obrigat\xF3rio"),
  width: z2.string().min(1, "Largura \xE9 obrigat\xF3ria"),
  height: z2.string().min(1, "Altura \xE9 obrigat\xF3ria"),
  quantity: z2.string().min(1, "Quantidade \xE9 obrigat\xF3ria"),
  unitPrice: z2.string().min(1, "Pre\xE7o unit\xE1rio \xE9 obrigat\xF3rio"),
  notes: z2.string().optional().nullable()
});
var updateOrderItemSchema = z2.object({
  id: z2.number().int().positive("ID do item \xE9 obrigat\xF3rio"),
  width: z2.string().optional(),
  height: z2.string().optional(),
  quantity: z2.string().optional(),
  unitPrice: z2.string().optional(),
  notes: z2.string().optional().nullable()
});
var createPurchaseOrderSchema = z2.object({
  supplierId: z2.number().int().positive("ID do fornecedor \xE9 obrigat\xF3rio"),
  status: z2.enum(["pendente", "confirmado", "recebido", "cancelado"]).default("pendente"),
  totalAmount: z2.string().default("0"),
  expectedDeliveryDate: z2.string().optional().nullable(),
  notes: z2.string().optional().nullable()
});
var updatePurchaseOrderSchema = z2.object({
  id: z2.number().int().positive("ID do pedido de compra \xE9 obrigat\xF3rio"),
  supplierId: z2.number().int().positive().optional(),
  status: z2.enum(["pendente", "confirmado", "recebido", "cancelado"]).optional(),
  totalAmount: z2.string().optional(),
  expectedDeliveryDate: z2.string().optional().nullable(),
  notes: z2.string().optional().nullable()
});
var createPurchaseOrderItemSchema = z2.object({
  purchaseOrderId: z2.number().int().positive("ID do pedido de compra \xE9 obrigat\xF3rio"),
  productId: z2.number().int().positive("ID do produto \xE9 obrigat\xF3rio"),
  quantity: z2.string().min(1, "Quantidade \xE9 obrigat\xF3ria"),
  unitCost: z2.string().min(1, "Custo unit\xE1rio \xE9 obrigat\xF3rio"),
  notes: z2.string().optional().nullable()
});
var updatePurchaseOrderItemSchema = z2.object({
  id: z2.number().int().positive("ID do item \xE9 obrigat\xF3rio"),
  quantity: z2.string().optional(),
  unitCost: z2.string().optional(),
  notes: z2.string().optional().nullable()
});
var createStockMovementSchema = z2.object({
  productId: z2.number().int().positive("ID do produto \xE9 obrigat\xF3rio"),
  type: z2.enum(["entrada", "saida"]),
  quantity: z2.number().int().positive("Quantidade \xE9 obrigat\xF3ria"),
  referenceType: z2.string().optional().nullable(),
  referenceId: z2.number().int().optional().nullable(),
  notes: z2.string().optional().nullable()
});

// server/routers/clients.ts
import { eq as eq2 } from "drizzle-orm";
var clientsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(clients).orderBy(clients.createdAt);
  }),
  get: protectedProcedure.input(updateClientSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(clients).where(eq2(clients.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Cliente n\xE3o encontrado");
    return result[0];
  }),
  create: protectedProcedure.input(createClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(clients).values(opts.input);
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updateClientSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(clients).set(data).where(eq2(clients.id, id));
    return { success: true };
  }),
  delete: protectedProcedure.input(updateClientSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(clients).where(eq2(clients.id, opts.input.id));
    return { success: true };
  })
});

// server/routers/products.ts
import { eq as eq3 } from "drizzle-orm";
var productsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(products).orderBy(products.name);
  }),
  get: protectedProcedure.input(updateProductSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(products).where(eq3(products.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Produto n\xE3o encontrado");
    return result[0];
  }),
  create: protectedProcedure.input(createProductSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, unitPrice, stockQuantity, minStockQuantity, ...rest } = opts.input;
    const result = await db.insert(products).values({
      ...rest,
      width,
      height,
      unitPrice,
      stockQuantity: Number(stockQuantity),
      minStockQuantity: Number(minStockQuantity)
    });
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updateProductSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, unitPrice, stockQuantity, minStockQuantity, ...rest } = opts.input;
    const data = { ...rest };
    if (width !== void 0) data.width = width;
    if (height !== void 0) data.height = height;
    if (unitPrice !== void 0) data.unitPrice = unitPrice;
    if (stockQuantity !== void 0) data.stockQuantity = Number(stockQuantity);
    if (minStockQuantity !== void 0) data.minStockQuantity = Number(minStockQuantity);
    await db.update(products).set(data).where(eq3(products.id, id));
    return { success: true };
  }),
  delete: protectedProcedure.input(updateProductSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(products).where(eq3(products.id, opts.input.id));
    return { success: true };
  })
});

// server/routers/suppliers.ts
import { eq as eq4 } from "drizzle-orm";
var suppliersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(suppliers).orderBy(suppliers.name);
  }),
  get: protectedProcedure.input(updateSupplierSchema.pick({ id: true })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(suppliers).where(eq4(suppliers.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Fornecedor n\xE3o encontrado");
    return result[0];
  }),
  create: protectedProcedure.input(createSupplierSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(suppliers).values(opts.input);
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updateSupplierSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(suppliers).set(data).where(eq4(suppliers.id, id));
    return { success: true };
  }),
  delete: protectedProcedure.input(updateSupplierSchema.pick({ id: true })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(suppliers).where(eq4(suppliers.id, opts.input.id));
    return { success: true };
  })
});

// server/routers/quotes.ts
import { z as z3 } from "zod";
import { eq as eq5 } from "drizzle-orm";
var quotesRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(quotes).orderBy(quotes.createdAt);
  }),
  get: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(quotes).where(eq5(quotes.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Or\xE7amento n\xE3o encontrado");
    return result[0];
  }),
  getItems: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(quoteItems).where(eq5(quoteItems.quoteId, opts.input.id));
  }),
  create: protectedProcedure.input(createQuoteSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input;
    data.userId = userId;
    if (data.validUntil) {
      data.validUntil = new Date(data.validUntil);
    } else {
      delete data.validUntil;
    }
    const result = await db.insert(quotes).values(data);
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updateQuoteSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    const updateData = data;
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }
    await db.update(quotes).set(updateData).where(eq5(quotes.id, id));
    return { success: true };
  }),
  delete: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(quoteItems).where(eq5(quoteItems.quoteId, opts.input.id));
    await db.delete(quotes).where(eq5(quotes.id, opts.input.id));
    return { success: true };
  }),
  addItem: protectedProcedure.input(createQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, quantity, unitPrice, ...rest } = opts.input;
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);
    const p = parseFloat(unitPrice);
    const squareMeters = w * h / 1e4;
    const subtotal = q * squareMeters * p;
    const result = await db.insert(quoteItems).values({
      ...rest,
      width,
      height,
      quantity: q,
      unitPrice,
      squareMeters: String(squareMeters.toFixed(4)),
      subtotal: String(subtotal.toFixed(2))
    });
    const items = await db.select().from(quoteItems).where(eq5(quoteItems.quoteId, opts.input.quoteId));
    const total = items.reduce((sum, item) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq5(quotes.id, opts.input.quoteId));
    return { success: true, insertId: result[0].insertId };
  }),
  updateItem: protectedProcedure.input(updateQuoteItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = await db.select().from(quoteItems).where(eq5(quoteItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const currentItem = item[0];
    const w = width ? parseFloat(width) : parseFloat(String(currentItem.width));
    const h = height ? parseFloat(height) : parseFloat(String(currentItem.height));
    const q = quantity ? parseInt(quantity) : currentItem.quantity;
    const p = unitPrice ? parseFloat(unitPrice) : parseFloat(String(currentItem.unitPrice));
    const squareMeters = w * h / 1e4;
    const subtotal = q * squareMeters * p;
    const data = { ...rest };
    if (width) data.width = width;
    if (height) data.height = height;
    if (quantity) data.quantity = q;
    if (unitPrice) data.unitPrice = unitPrice;
    data.squareMeters = String(squareMeters.toFixed(4));
    data.subtotal = String(subtotal.toFixed(2));
    await db.update(quoteItems).set(data).where(eq5(quoteItems.id, id));
    const items = await db.select().from(quoteItems).where(eq5(quoteItems.quoteId, currentItem.quoteId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq5(quotes.id, currentItem.quoteId));
    return { success: true };
  }),
  deleteItem: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(quoteItems).where(eq5(quoteItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const quoteId = item[0].quoteId;
    await db.delete(quoteItems).where(eq5(quoteItems.id, opts.input.id));
    const items = await db.select().from(quoteItems).where(eq5(quoteItems.quoteId, quoteId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(quotes).set({ totalAmount: String(total.toFixed(2)) }).where(eq5(quotes.id, quoteId));
    return { success: true };
  }),
  convertToOrder: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const quoteList = await db.select().from(quotes).where(eq5(quotes.id, opts.input.id)).limit(1);
    if (quoteList.length === 0) throw new Error("Or\xE7amento n\xE3o encontrado");
    const q = quoteList[0];
    const orderResult = await db.insert(orders).values({
      clientId: q.clientId,
      userId: q.userId,
      quoteId: q.id,
      status: "aprovado",
      totalAmount: q.totalAmount
    });
    const orderId = orderResult[0].insertId;
    const quoteItemsList = await db.select().from(quoteItems).where(eq5(quoteItems.quoteId, q.id));
    for (const qi of quoteItemsList) {
      await db.insert(orderItems).values({
        orderId,
        productId: qi.productId,
        width: qi.width,
        height: qi.height,
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        squareMeters: qi.squareMeters,
        subtotal: qi.subtotal
      });
      const currentProduct = await db.select().from(products).where(eq5(products.id, qi.productId)).limit(1);
      if (currentProduct.length > 0) {
        const newStock = currentProduct[0].stockQuantity - qi.quantity;
        await db.update(products).set({ stockQuantity: newStock }).where(eq5(products.id, qi.productId));
      }
      await db.insert(stockMovements).values({
        productId: qi.productId,
        type: "saida",
        quantity: qi.quantity,
        referenceType: "order",
        referenceId: orderId,
        notes: `Sa\xEDda pelo pedido #${orderId}`
      });
    }
    await db.update(quotes).set({ status: "convertido" }).where(eq5(quotes.id, q.id));
    return { success: true, orderId };
  })
});

// server/routers/orders.ts
import { z as z4 } from "zod";
import { eq as eq6 } from "drizzle-orm";
var ordersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orders).orderBy(orders.createdAt);
  }),
  get: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(orders).where(eq6(orders.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Pedido n\xE3o encontrado");
    return result[0];
  }),
  getItems: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(orderItems).where(eq6(orderItems.orderId, opts.input.id));
  }),
  create: protectedProcedure.input(createOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input;
    data.userId = userId;
    const result = await db.insert(orders).values(data);
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updateOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    await db.update(orders).set(data).where(eq6(orders.id, id));
    return { success: true };
  }),
  updateStatus: protectedProcedure.input(z4.object({ id: z4.number().int().positive(), status: z4.enum(["aprovado", "em_producao", "pronto", "entregue", "cancelado"]) })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const order = await db.select().from(orders).where(eq6(orders.id, opts.input.id)).limit(1);
    if (order.length === 0) throw new Error("Pedido n\xE3o encontrado");
    const currentOrder = order[0];
    const previousStatus = currentOrder.status;
    await db.update(orders).set({ status: opts.input.status }).where(eq6(orders.id, opts.input.id));
    if (opts.input.status === "cancelado" && previousStatus !== "cancelado") {
      const items = await db.select().from(orderItems).where(eq6(orderItems.orderId, opts.input.id));
      for (const item of items) {
        const currentProduct = await db.select().from(products).where(eq6(products.id, item.productId)).limit(1);
        if (currentProduct.length > 0) {
          const newStock = currentProduct[0].stockQuantity + item.quantity;
          await db.update(products).set({ stockQuantity: newStock }).where(eq6(products.id, item.productId));
        }
        await db.insert(stockMovements).values({
          productId: item.productId,
          type: "entrada",
          quantity: item.quantity,
          referenceType: "order_cancel",
          referenceId: opts.input.id,
          notes: `Estorno - Cancelamento do pedido #${opts.input.id}`
        });
      }
    }
    if (previousStatus === "cancelado" && opts.input.status !== "cancelado") {
      const items = await db.select().from(orderItems).where(eq6(orderItems.orderId, opts.input.id));
      for (const item of items) {
        const currentProduct = await db.select().from(products).where(eq6(products.id, item.productId)).limit(1);
        if (currentProduct.length > 0) {
          const newStock = Math.max(0, currentProduct[0].stockQuantity - item.quantity);
          await db.update(products).set({ stockQuantity: newStock }).where(eq6(products.id, item.productId));
        }
        await db.insert(stockMovements).values({
          productId: item.productId,
          type: "saida",
          quantity: item.quantity,
          referenceType: "order",
          referenceId: opts.input.id,
          notes: `Sa\xEDda pelo pedido #${opts.input.id}`
        });
      }
    }
    return { success: true };
  }),
  delete: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(orderItems).where(eq6(orderItems.orderId, opts.input.id));
    await db.delete(orders).where(eq6(orders.id, opts.input.id));
    return { success: true };
  }),
  addItem: protectedProcedure.input(createOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { width, height, quantity, unitPrice, ...rest } = opts.input;
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);
    const p = parseFloat(unitPrice);
    const squareMeters = w * h / 1e4;
    const subtotal = q * squareMeters * p;
    const result = await db.insert(orderItems).values({
      ...rest,
      width,
      height,
      quantity: q,
      unitPrice,
      squareMeters: String(squareMeters.toFixed(4)),
      subtotal: String(subtotal.toFixed(2))
    });
    const items = await db.select().from(orderItems).where(eq6(orderItems.orderId, opts.input.orderId));
    const total = items.reduce((sum, item) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq6(orders.id, opts.input.orderId));
    return { success: true, insertId: result[0].insertId };
  }),
  updateItem: protectedProcedure.input(updateOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, width, height, quantity, unitPrice, ...rest } = opts.input;
    const item = await db.select().from(orderItems).where(eq6(orderItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const currentItem = item[0];
    const w = width ? parseFloat(width) : parseFloat(String(currentItem.width));
    const h = height ? parseFloat(height) : parseFloat(String(currentItem.height));
    const q = quantity ? parseInt(quantity) : currentItem.quantity;
    const p = unitPrice ? parseFloat(unitPrice) : parseFloat(String(currentItem.unitPrice));
    const squareMeters = w * h / 1e4;
    const subtotal = q * squareMeters * p;
    const data = { ...rest };
    if (width) data.width = width;
    if (height) data.height = height;
    if (quantity) data.quantity = q;
    if (unitPrice) data.unitPrice = unitPrice;
    data.squareMeters = String(squareMeters.toFixed(4));
    data.subtotal = String(subtotal.toFixed(2));
    await db.update(orderItems).set(data).where(eq6(orderItems.id, id));
    const items = await db.select().from(orderItems).where(eq6(orderItems.orderId, currentItem.orderId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq6(orders.id, currentItem.orderId));
    return { success: true };
  }),
  deleteItem: protectedProcedure.input(z4.object({ id: z4.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(orderItems).where(eq6(orderItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const orderId = item[0].orderId;
    await db.delete(orderItems).where(eq6(orderItems.id, opts.input.id));
    const items = await db.select().from(orderItems).where(eq6(orderItems.orderId, orderId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(orders).set({ totalAmount: String(total.toFixed(2)) }).where(eq6(orders.id, orderId));
    return { success: true };
  })
});

// server/routers/purchaseOrders.ts
import { z as z5 } from "zod";
import { eq as eq7 } from "drizzle-orm";
var purchaseOrdersRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(purchaseOrders).orderBy(purchaseOrders.createdAt);
  }),
  get: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(purchaseOrders).where(eq7(purchaseOrders.id, opts.input.id)).limit(1);
    if (result.length === 0) throw new Error("Pedido de compra n\xE3o encontrado");
    return result[0];
  }),
  getItems: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, opts.input.id));
  }),
  create: protectedProcedure.input(createPurchaseOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = opts.ctx.user?.id ?? 0;
    const data = opts.input;
    data.userId = userId;
    if (data.expectedDeliveryDate) {
      data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    } else {
      delete data.expectedDeliveryDate;
    }
    const result = await db.insert(purchaseOrders).values(data);
    return { success: true, insertId: result[0].insertId };
  }),
  update: protectedProcedure.input(updatePurchaseOrderSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = opts.input;
    const updateData = data;
    if (updateData.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = new Date(updateData.expectedDeliveryDate);
    }
    await db.update(purchaseOrders).set(updateData).where(eq7(purchaseOrders.id, id));
    return { success: true };
  }),
  delete: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, opts.input.id));
    await db.delete(purchaseOrders).where(eq7(purchaseOrders.id, opts.input.id));
    return { success: true };
  }),
  addItem: protectedProcedure.input(createPurchaseOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { quantity, unitCost, ...rest } = opts.input;
    const q = parseInt(quantity);
    const c = parseFloat(unitCost);
    const subtotal = q * c;
    const result = await db.insert(purchaseOrderItems).values({
      ...rest,
      quantity: q,
      unitCost,
      subtotal: String(subtotal.toFixed(2))
    });
    const items = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, opts.input.purchaseOrderId));
    const total = items.reduce((sum, item) => sum + parseFloat(String(item.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq7(purchaseOrders.id, opts.input.purchaseOrderId));
    return { success: true, insertId: result[0].insertId };
  }),
  updateItem: protectedProcedure.input(updatePurchaseOrderItemSchema).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, quantity, unitCost, ...rest } = opts.input;
    const item = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.id, id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const currentItem = item[0];
    const q = quantity ? parseInt(quantity) : currentItem.quantity;
    const c = unitCost ? parseFloat(unitCost) : parseFloat(String(currentItem.unitCost));
    const subtotal = q * c;
    const data = { ...rest };
    if (quantity) data.quantity = q;
    if (unitCost) data.unitCost = unitCost;
    data.subtotal = String(subtotal.toFixed(2));
    await db.update(purchaseOrderItems).set(data).where(eq7(purchaseOrderItems.id, id));
    const items = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, currentItem.purchaseOrderId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq7(purchaseOrders.id, currentItem.purchaseOrderId));
    return { success: true };
  }),
  deleteItem: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const item = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.id, opts.input.id)).limit(1);
    if (item.length === 0) throw new Error("Item n\xE3o encontrado");
    const poId = item[0].purchaseOrderId;
    await db.delete(purchaseOrderItems).where(eq7(purchaseOrderItems.id, opts.input.id));
    const items = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, poId));
    const total = items.reduce((sum, it) => sum + parseFloat(String(it.subtotal)), 0);
    await db.update(purchaseOrders).set({ totalAmount: String(total.toFixed(2)) }).where(eq7(purchaseOrders.id, poId));
    return { success: true };
  }),
  receive: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const po = await db.select().from(purchaseOrders).where(eq7(purchaseOrders.id, opts.input.id)).limit(1);
    if (po.length === 0) throw new Error("Pedido de compra n\xE3o encontrado");
    const items = await db.select().from(purchaseOrderItems).where(eq7(purchaseOrderItems.purchaseOrderId, opts.input.id));
    for (const item of items) {
      const currentProduct = await db.select().from(products).where(eq7(products.id, item.productId)).limit(1);
      if (currentProduct.length > 0) {
        const newStock = currentProduct[0].stockQuantity + item.quantity;
        await db.update(products).set({ stockQuantity: newStock }).where(eq7(products.id, item.productId));
      }
      await db.insert(stockMovements).values({
        productId: item.productId,
        type: "entrada",
        quantity: item.quantity,
        referenceType: "purchase_order",
        referenceId: opts.input.id,
        notes: `Entrada pelo pedido de compra #${opts.input.id}`
      });
    }
    await db.update(purchaseOrders).set({ status: "recebido" }).where(eq7(purchaseOrders.id, opts.input.id));
    return { success: true };
  })
});

// server/routers/stockMovements.ts
import { z as z6 } from "zod";
import { eq as eq8 } from "drizzle-orm";
var stockMovementsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(stockMovements).orderBy(stockMovements.createdAt);
  }),
  listByProduct: protectedProcedure.input(z6.object({ productId: z6.number().int().positive() })).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(stockMovements).where(eq8(stockMovements.productId, opts.input.productId));
  }),
  manualEntry: protectedProcedure.input(z6.object({ productId: z6.number().int().positive(), type: z6.enum(["entrada", "saida"]), quantity: z6.number().int().positive(), notes: z6.string().optional().nullable() })).mutation(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const product = await db.select().from(products).where(eq8(products.id, opts.input.productId)).limit(1);
    if (product.length === 0) throw new Error("Produto n\xE3o encontrado");
    const currentProduct = product[0];
    if (opts.input.type === "entrada") {
      const newStock = currentProduct.stockQuantity + opts.input.quantity;
      await db.update(products).set({ stockQuantity: newStock }).where(eq8(products.id, opts.input.productId));
    } else {
      if (opts.input.quantity > currentProduct.stockQuantity) {
        throw new Error("Quantidade em estoque insuficiente");
      }
      const newStock = currentProduct.stockQuantity - opts.input.quantity;
      await db.update(products).set({ stockQuantity: newStock }).where(eq8(products.id, opts.input.productId));
    }
    await db.insert(stockMovements).values({
      productId: opts.input.productId,
      type: opts.input.type,
      quantity: opts.input.quantity,
      referenceType: "manual",
      notes: opts.input.notes || null
    });
    return { success: true };
  })
});

// server/routers/dashboard.ts
import { z as z7 } from "zod";
import { eq as eq9, desc, and, gte, lte } from "drizzle-orm";
var dashboardRouter = router({
  stats: protectedProcedure.input(z7.object({ period: z7.enum(["7d", "30d", "90d", "month", "year"]).default("30d") }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const now = /* @__PURE__ */ new Date();
    let startDate;
    if (opts.input?.period === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    else if (opts.input?.period === "90d") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
    else if (opts.input?.period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (opts.input?.period === "year") startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const deliveredOrders = await db.select().from(orders).where(and(eq9(orders.status, "entregue"), gte(orders.createdAt, startDate)));
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
    const allOrders = await db.select().from(orders).orderBy(orders.createdAt);
    const ordersByStatus = {};
    for (const o of allOrders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    }
    const allProducts = await db.select().from(products);
    const criticalStock = allProducts.filter((p) => p.stockQuantity <= p.minStockQuantity && p.stockQuantity > 0);
    const outOfStock = allProducts.filter((p) => p.stockQuantity === 0);
    const activeQuotes = await db.select().from(quotes).where(eq9(quotes.status, "rascunho"));
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
    return {
      totalRevenue,
      ordersByStatus,
      totalOrders: allOrders.length,
      criticalStock: criticalStock.length,
      outOfStock: outOfStock.length,
      activeQuotes: activeQuotes.length,
      recentOrders,
      pendingPurchases: allProducts.filter((p) => p.stockQuantity < p.minStockQuantity * 2).length
    };
  }),
  revenueByMonth: protectedProcedure.input(z7.object({ months: z7.number().int().positive().default(6) }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const now = /* @__PURE__ */ new Date();
    const months = opts.input?.months || 6;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthOrders = await db.select().from(orders).where(
        and(eq9(orders.status, "entregue"), gte(orders.createdAt, d), lte(orders.createdAt, nextD))
      );
      const revenue = monthOrders.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
      data.push({ month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), revenue });
    }
    return data;
  }),
  commissions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const deliveredOrders = await db.select().from(orders).where(eq9(orders.status, "entregue"));
    const userList = await db.select().from(users);
    const commissions = [];
    for (const u of userList) {
      const userOrders = deliveredOrders.filter((o) => o.userId === u.id);
      const totalSales = userOrders.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
      commissions.push({
        userId: u.id,
        userName: u.name || u.email || `User #${u.id}`,
        totalSales,
        commission: totalSales * 0.05
        // 5% commission
      });
    }
    return commissions.filter((c) => c.totalSales > 0);
  }),
  stockAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProducts = await db.select().from(products);
    const movements = await db.select().from(stockMovements);
    return allProducts.map((p) => {
      const productMovements = movements.filter((m) => m.productId === p.id);
      const totalIn = productMovements.filter((m) => m.type === "entrada").reduce((sum, m) => sum + m.quantity, 0);
      const totalOut = productMovements.filter((m) => m.type === "saida").reduce((sum, m) => sum + m.quantity, 0);
      return {
        ...p,
        totalIn,
        totalOut,
        status: p.stockQuantity === 0 ? "Esgotado" : p.stockQuantity <= p.minStockQuantity ? "Cr\xEDtico" : "Normal"
      };
    });
  })
});

// server/routers/reports.ts
import { z as z8 } from "zod";
import { eq as eq10, desc as desc2, sql as sql2 } from "drizzle-orm";
var reportsRouter = router({
  revenue: protectedProcedure.input(z8.object({ startDate: z8.string().optional(), endDate: z8.string().optional() }).optional()).query(async (opts) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    let query = db.select().from(orders).where(eq10(orders.status, "entregue"));
    if (opts?.input?.startDate && opts?.input?.endDate) {
      const start = new Date(opts.input.startDate);
      const end = new Date(opts.input.endDate);
      end.setHours(23, 59, 59, 999);
      const result = await db.execute(
        sql2`SELECT * FROM orders WHERE status = 'entregue' AND createdAt >= ${start.toISOString()} AND createdAt <= ${end.toISOString()} ORDER BY createdAt DESC`
      );
      return result;
    }
    return await query.orderBy(desc2(orders.createdAt));
  }),
  revenueSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const delivered = await db.select().from(orders).where(eq10(orders.status, "entregue"));
    const totalRevenue = delivered.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
    const totalOrders = delivered.length;
    const itemCounts = await db.select().from(orderItems);
    const totalItems = itemCounts.reduce((sum, item) => sum + parseInt(String(item.quantity)), 0);
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalItems,
      averageTicket: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"
    };
  }),
  commissions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const deliveredOrders = await db.select().from(orders).where(eq10(orders.status, "entregue"));
    const userList = await db.select().from(users);
    const byUser = {};
    for (const o of deliveredOrders) {
      const key = String(o.userId);
      if (!byUser[key]) {
        byUser[key] = { totalSales: 0, orderCount: 0 };
      }
      byUser[key].totalSales += parseFloat(String(o.totalAmount));
      byUser[key].orderCount++;
    }
    return Object.entries(byUser).map(([userId, data]) => {
      const user = userList.find((u) => u.id === parseInt(userId));
      return {
        userName: user?.name || user?.email || `User #${userId}`,
        deliveredOrders: data.orderCount,
        totalSales: parseFloat(data.totalSales.toFixed(2)),
        commission: parseFloat((data.totalSales * 0.05).toFixed(2))
      };
    });
  }),
  stockAnalysis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProducts = await db.select().from(products);
    return allProducts.map((p) => {
      const stock = p.stockQuantity || 0;
      const min = p.minStockQuantity || 10;
      const status = stock === 0 ? "esgotado" : stock <= min ? "critico" : stock <= min * 2 ? "baixo" : "normal";
      let action = "Nenhuma";
      if (status === "esgotado") action = "Reposi\xE7\xE3o urgente";
      if (status === "critico") action = "Solicitar compra";
      if (status === "baixo") action = "Monitorar";
      return {
        productName: p.name,
        type: p.type || "N/A",
        currentStock: stock,
        minStock: min,
        status,
        recommendedAction: action,
        stockValue: (stock * parseFloat(String(p.unitPrice))).toFixed(2)
      };
    });
  }),
  quotesReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allQuotes = await db.select().from(quotes).orderBy(desc2(quotes.createdAt));
    const clientList = await db.select().from(clients);
    return allQuotes.map((q) => ({
      quoteId: q.id,
      clientName: clientList.find((c) => c.id === q.clientId)?.name || `Cliente #${q.clientId}`,
      status: q.status,
      totalAmount: String(q.totalAmount),
      createdAt: q.createdAt.toISOString().split("T")[0]
    }));
  }),
  stockMovementsReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const movements = await db.select().from(stockMovements).orderBy(desc2(stockMovements.createdAt));
    const productList = await db.select().from(products);
    return movements.map((m) => ({
      movementId: m.id,
      productName: productList.find((p) => p.id === m.productId)?.name || `Produto #${m.productId}`,
      type: m.movementType,
      quantity: m.quantity,
      sourceType: m.sourceType || "manual",
      reference: m.reference || "-",
      movementDate: m.movementDate ? new Date(m.movementDate).toLocaleDateString("pt-BR") : "-"
    }));
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  clients: clientsRouter,
  products: productsRouter,
  suppliers: suppliersRouter,
  quotes: quotesRouter,
  orders: ordersRouter,
  purchaseOrders: purchaseOrdersRouter,
  stockMovements: stockMovementsRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/azure-startup.ts
import path from "path";
var app = express();
var server = createServer(app);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var publicPath = path.resolve(import.meta.dirname, "public");
app.use(express.static(publicPath));
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(publicPath, "index.html"));
});
var port = parseInt(process.env.PORT || "80");
server.listen(port, () => {
  console.log(`Vidrix ERP running on port ${port}`);
});
