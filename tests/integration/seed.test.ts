import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";

describe("Database Seed Script", () => {
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

  it("seeds 1 monitoring node and 24 telemetry logs", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);

    const nodes = await drizzleDb.select().from(schema.monitoringNodes);
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe("NODE-001");

    const logs = await drizzleDb.select().from(schema.telemetryLogs);
    expect(logs.length).toBe(24);
    expect(logs[0].monitoringNodeId).toBe("NODE-001");
  });
});
