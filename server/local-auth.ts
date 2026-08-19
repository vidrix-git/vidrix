/**
 * Local authentication module - replaces Manus OAuth
 * Uses JWT tokens with bcrypt password hashing
 */
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

// JWT secret from env
function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret || process.env.JWT_SECRET || "vidrix-dev-secret");
}

// Token expiration: 7 days
const TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export type LocalUserRole = "admin" | "superadmin" | "user" | "cashier";

/** Both administrator roles are authorized for protected ERP administration. */
export function isPrivilegedRole(role: string): role is "admin" | "superadmin" {
  return role === "admin" || role === "superadmin";
}

// Password hashing with PBKDF2
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

/**
 * Compares the bootstrap password only while an inherited administrator record
 * has not yet been migrated to a PBKDF2 hash in the database.
 */
export function matchesBootstrapAdminPassword(password: string, defaultPassword: string): boolean {
  return password === defaultPassword;
}

type DatabaseErrorShape = {
  code?: unknown;
  message?: unknown;
  sqlMessage?: unknown;
  cause?: unknown;
};

/**
 * Drizzle may wrap a MySQL error more than once. Inspect the error chain so a
 * previously-created password column is treated as an idempotent migration.
 */
export function isDuplicatePasswordColumnError(error: unknown): boolean {
  const inspected = new Set<unknown>();

  const inspect = (current: unknown): boolean => {
    if (typeof current === "string") {
      return /duplicate column name\s+['`]?password|duplicate column name/i.test(current);
    }

    if (!current || typeof current !== "object" || inspected.has(current)) {
      return false;
    }

    inspected.add(current);
    const candidate = current as DatabaseErrorShape;
    return (
      candidate.code === "ER_DUP_FIELDNAME" ||
      inspect(candidate.message) ||
      inspect(candidate.sqlMessage) ||
      inspect(candidate.cause)
    );
  };

  return inspect(error);
}

let passwordColumnReady: Promise<void> | null = null;

/**
 * Supports existing databases created before local authentication was added.
 * The operation is idempotent: a duplicate-column error means the schema is
 * already correct, while any other database error remains visible to callers.
 */
function ensurePasswordColumn(db: any): Promise<void> {
  if (!passwordColumnReady) {
    passwordColumnReady = (async () => {
      try {
        await db.execute(sql.raw("ALTER TABLE `users` ADD COLUMN `password` varchar(255) NULL"));
        console.log("[Auth] Password column added to users table");
      } catch (error) {
        if (!isDuplicatePasswordColumnError(error)) {
          passwordColumnReady = null;
          throw error;
        }
      }
    })();
  }

  return passwordColumnReady;
}

// Create JWT token
async function createToken(userId: number, name: string, role: string): Promise<string> {
  const secretKey = getSecretKey();
  const payload = {
    sub: String(userId),
    name,
    role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + TOKEN_EXPIRATION_MS) / 1000))
    .sign(secretKey);

  return token;
}

// Verify JWT token
async function verifyToken(token: string): Promise<{ userId: number; name: string; role: string } | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) return null;
    return {
      userId: parseInt(sub, 10),
      name: (payload.name as string) || "",
      role: (payload.role as string) || "user",
    };
  } catch {
    return null;
  }
}

// Login with username/password
export async function localLogin(
  identifier: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  const db = await getDb();
  if (!db) return null;
  await ensurePasswordColumn(db);

  // Try to find user by email or name
  const results = await db
    .select()
    .from(users)
    .where(sql`${users.email} = ${identifier} OR ${users.name} = ${identifier}`)
    .limit(10);

  // Also try by openId (for compatibility with existing admin user)
  if (results.length === 0) {
    const byOpenId = await db
      .select()
      .from(users)
      .where(eq(users.openId, identifier))
      .limit(1);
    results.push(...byOpenId);
  }

  for (const user of results) {
    // Check password field
    const storedHash = (user as any).password;
    if (storedHash && verifyPassword(password, storedHash)) {
      const token = await createToken(user.id, user.name || "", user.role);
      return { user, token };
    }

    // For admin user without password (created via Manus), check default admin password
    if (isPrivilegedRole(user.role) && !storedHash) {
      const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
      if (matchesBootstrapAdminPassword(password, defaultPassword)) {
        // Hash the default password for future use
        await db
          .update(users)
          .set({ password: hashPassword(password) } as any)
          .where(eq(users.id, user.id));
        const token = await createToken(user.id, user.name || "", user.role);
        return { user, token };
      }
    }
  }

  return null;
}

// Register new user
export async function localRegister(
  name: string,
  email: string,
  password: string,
  role: LocalUserRole = "user"
): Promise<{ user: User; token: string } | null> {
  const db = await getDb();
  if (!db) return null;
  await ensurePasswordColumn(db);

  const hashedPassword = hashPassword(password);
  const openId = `local:${email || name}`;

  try {
    const [inserted] = await db
      .insert(users)
      .values({
        openId,
        name,
        email,
        role,
        loginMethod: "local",
        lastSignedIn: new Date(),
        password: hashedPassword,
      } as any)
      .$returningId();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, inserted.id))
      .limit(1);

    if (user.length === 0) return null;

    const token = await createToken(user[0].id, user[0].name || "", user[0].role);
    return { user: user[0], token };
  } catch (error) {
    console.error("[Auth] Registration failed:", error);
    return null;
  }
}

// Ensure default admin exists
export async function ensureDefaultAdmin(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensurePasswordColumn(db);

  const existing = await db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('admin', 'superadmin')`)
    .limit(1);

  if (existing.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    await db.insert(users).values({
      openId: "local:admin",
      name: "Admin",
      email: "admin@vidrix.local",
      role: "admin",
      loginMethod: "local",
      lastSignedIn: new Date(),
      password: hashPassword(adminPassword),
    } as any);
    console.log("[Auth] Default admin created (admin/admin123)");
  }
}

export { createToken, verifyToken, hashPassword, verifyPassword };
