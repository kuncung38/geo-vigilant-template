import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { app } from "../../src/server/index";

describe("POST /api/telemetry", () => {
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

  it("returns 401 Unauthorized when Authorization header is missing", async () => {
    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: 100 }),
      },
      { DB: db },
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 Unauthorized when Authorization token is invalid", async () => {
    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ sequence: 100 }),
      },
      { DB: db },
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 Bad Request when JSON payload is invalid schema", async () => {
    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer NODE-C4-A1-token",
        },
        body: JSON.stringify({ sequence: "invalid" }),
      },
      { DB: db },
    );

    expect(res.status).toBe(400);
  });

  it("returns 201 Created and persists telemetry when valid", async () => {
    const payload = {
      sequence: 100,
      deviceTimestamp: Math.floor(Date.now() / 1000),
      radonValue: 45.2,
      radonCondition: "Normal",
      radonMinThreshold: 0,
      radonMaxThreshold: 100,
      soilMoistureValue: 40.5,
      soilMoistureCondition: "Normal",
      soilMoistureMinThreshold: 20,
      soilMoistureMaxThreshold: 80,
      gyroValue: 0.15,
      gyroCondition: "Normal",
      gyroMinThreshold: -1,
      gyroMaxThreshold: 1,
      rainfallValue: 0.5,
      rainfallCondition: "Normal",
      rainfallMinThreshold: 0,
      rainfallMaxThreshold: 10,
      overallCondition: "Normal",
      isLandslide: 0,
    };

    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer NODE-C4-A1-token",
        },
        body: JSON.stringify(payload),
      },
      { DB: db },
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ success: true });

    const logs = await drizzleDb
      .select()
      .from(schema.telemetryLogs)
      .where(eq(schema.telemetryLogs.sequence, 100));
    expect(logs.length).toBe(1);
    expect(logs[0].radonValue).toBe(45.2);
  });
});
