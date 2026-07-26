import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { app } from "../../src/server/index";

describe("GET /api/nodes", () => {
  let db: Database;
  let drizzleDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
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
  });

  it("returns 200 and empty array when no nodes exist", async () => {
    const res = await app.request("/api/nodes", {}, { DB: db });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("returns 200 and list of nodes when nodes exist", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);

    const res = await app.request("/api/nodes", {}, { DB: db });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ id: string; name: string }>;
    expect(json.length).toBe(3);
    expect(json.map((n) => n.id)).toContain("NODE-C4-A1");
    expect(json.map((n) => n.name)).toContain("Cianjur Sektor 4");
  });

  it("returns 200 and node detail for GET /api/nodes/:id", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);

    const res = await app.request("/api/nodes/NODE-C4-A1", {}, { DB: db });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { id: string; name: string };
    expect(json.id).toBe("NODE-C4-A1");
  });

  it("returns 404 for GET /api/nodes/:id when node does not exist", async () => {
    const res = await app.request("/api/nodes/NON-EXISTENT", {}, { DB: db });
    expect(res.status).toBe(404);
  });
});
