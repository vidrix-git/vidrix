import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { verifyToken } from "../local-auth";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try to get JWT token from cookie or Authorization header
    let token: string | undefined;

    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      token = cookies[COOKIE_NAME];
    }

    // Fallback to Authorization header
    if (!token) {
      const authHeader = opts.req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      const session = await verifyToken(token);
      if (session) {
        const db = await getDb();
        if (db) {
          const results = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);
          user = results.length > 0 ? results[0] : null;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
