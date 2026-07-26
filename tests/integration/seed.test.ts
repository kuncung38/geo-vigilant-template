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

  it("seeds the 3 West Java nodes with 24 telemetry logs each", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);

    const nodes = await drizzleDb.select().from(schema.monitoringNodes);
    expect(nodes.length).toBe(3);
    expect(nodes.map((n) => n.id).sort()).toEqual([
      "NODE-C4-A1",
      "NODE-G2-D1",
      "NODE-S1-B2",
    ]);

    const logs = await drizzleDb.select().from(schema.telemetryLogs);
    expect(logs.length).toBe(72);
    for (const node of nodes) {
      expect(logs.filter((l) => l.monitoringNodeId === node.id).length).toBe(
        24,
      );
    }
  });

  it("seeds every node inside the monitored region, never off-continent", async () => {
    // Regression: a demo node at 37.7749,-122.4194 (San Francisco) shipped to
    // production and stretched the map's auto-framing to a whole-globe view.
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);

    const nodes = await drizzleDb.select().from(schema.monitoringNodes);
    for (const node of nodes) {
      expect(node.latitude).toBeGreaterThan(-9);
      expect(node.latitude).toBeLessThan(-5);
      expect(node.longitude).toBeGreaterThan(105);
      expect(node.longitude).toBeLessThan(110);
    }
  });
});
