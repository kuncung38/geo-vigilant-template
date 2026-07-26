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
    const migrationPath = path.resolve("drizzle/0000_initial.sql");
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      for (const stmt of sql.split("--> statement-breakpoint")) {
        if (stmt.trim()) db.prepare(stmt.trim()).run();
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
