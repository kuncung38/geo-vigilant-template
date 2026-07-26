import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getDb } from "../db/client";
import { monitoringNodes } from "../db/schema";
import type { AppEnv } from "./types";

export async function sha256(message: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(message).digest("hex");
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenHash = await sha256(token);
  const db = getDb(c.env.DB);

  const [node] = await db
    .select()
    .from(monitoringNodes)
    .where(eq(monitoringNodes.deviceTokenHash, tokenHash))
    .limit(1);

  if (!node) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("nodeId", node.id);
  await next();
}
