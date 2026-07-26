import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { app } from "../../src/server/index";

describe("GET /api/telemetry", () => {
  let db: Database;
  let drizzleDb: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const drizzleDir = path.resolve("drizzle");
    if (fs.existsSync(drizzleDir)) {
      const files = fs
        .readdirSync(drizzleDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
      for (const file of files) {
        const sql = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
        for (const stmt of sql.split("--> statement-breakpoint")) {
          if (stmt.trim()) db.exec(stmt);
        }
      }
    }
    drizzleDb = drizzle(db, { schema });
    // biome-ignore lint/suspicious/noExplicitAny: seedDatabase takes a D1 or bun:sqlite drizzle client, whose types are not interchangeable
    await seedDatabase(drizzleDb as any);
  });

  it("returns 400 Bad Request when nodeId query param is missing", async () => {
    const res = await app.request("/api/telemetry", {}, { DB: db });
    expect(res.status).toBe(400);
  });

  it("returns 200 and ordered telemetry logs for a nodeId", async () => {
    const res = await app.request(
      "/api/telemetry?nodeId=NODE-C4-A1",
      {},
      { DB: db },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{
      sequence: number;
      receivedAt: number;
    }>;
    expect(json.length).toBe(24);
    expect(json[0].receivedAt).toBeGreaterThanOrEqual(json[1].receivedAt);
  });

  it("respects limit query param (default 50, max 100)", async () => {
    const res = await app.request(
      "/api/telemetry?nodeId=NODE-C4-A1&limit=5",
      {},
      { DB: db },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ sequence: number }>;
    expect(json.length).toBe(5);
  });
});
