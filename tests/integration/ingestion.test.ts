import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { mintToken } from "../../scripts/mint-device-token";
import { buildReading } from "../../scripts/simulate-device";
import * as schema from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { app } from "../../src/server/index";

/**
 * End-to-end ingestion: a minted token must authenticate a device and its
 * reading must land in the database and update the node's condition.
 *
 * Production shipped with placeholder token hashes ("hash1"), which no token can
 * ever produce, so every device POST returned 401 and the system could not take
 * in data at all. These tests fail if that regresses.
 */
describe("device telemetry ingestion", () => {
  let db: Database;
  let drizzleDb: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const drizzleDir = path.resolve("drizzle");
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
    drizzleDb = drizzle(db, { schema });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    await seedDatabase(drizzleDb as any);
  });

  async function installToken(nodeId: string): Promise<string> {
    const { token, tokenHash } = await mintToken(nodeId);
    await drizzleDb
      .update(schema.monitoringNodes)
      .set({ deviceTokenHash: tokenHash })
      .where(eq(schema.monitoringNodes.id, nodeId));
    return token;
  }

  it("accepts a reading from a device holding a freshly minted token", async () => {
    const token = await installToken("NODE-C4-A1");
    const reading = buildReading("Normal", 5001, Math.floor(Date.now() / 1000));

    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reading),
      },
      { DB: db },
    );

    expect(res.status).toBe(201);

    const stored = await drizzleDb
      .select()
      .from(schema.telemetryLogs)
      .where(eq(schema.telemetryLogs.sequence, 5001));
    expect(stored).toHaveLength(1);
    expect(stored[0].monitoringNodeId).toBe("NODE-C4-A1");
  });

  it("stores every node token as a SHA-256 digest, never a placeholder", async () => {
    await installToken("NODE-C4-A1");
    const [node] = await drizzleDb
      .select()
      .from(schema.monitoringNodes)
      .where(eq(schema.monitoringNodes.id, "NODE-C4-A1"));

    // 64 hex chars. "hash1" — the value that shipped — fails this outright.
    expect(node.deviceTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("promotes the node's condition when a dangerous reading arrives", async () => {
    const token = await installToken("NODE-C4-A1");
    const reading = buildReading("Danger", 5002, Math.floor(Date.now() / 1000));
    expect(reading.overallCondition).toBe("Danger");

    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reading),
      },
      { DB: db },
    );
    expect(res.status).toBe(201);

    const [node] = await drizzleDb
      .select()
      .from(schema.monitoringNodes)
      .where(eq(schema.monitoringNodes.id, "NODE-C4-A1"));
    expect(node.overallCondition).toBe("Danger");
  });

  it("attributes the reading to the token's own node, not a caller-supplied id", async () => {
    // The route takes nodeId from the authenticated token, so a device cannot
    // write telemetry on another node's behalf.
    const token = await installToken("NODE-S1-B2");
    const reading = {
      ...buildReading("Normal", 5003, Math.floor(Date.now() / 1000)),
      monitoringNodeId: "NODE-G2-D1",
    };

    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reading),
      },
      { DB: db },
    );
    expect(res.status).toBe(201);

    const stored = await drizzleDb
      .select()
      .from(schema.telemetryLogs)
      .where(eq(schema.telemetryLogs.sequence, 5003));
    expect(stored[0].monitoringNodeId).toBe("NODE-S1-B2");
  });

  it("rejects a token that was never minted", async () => {
    const res = await app.request(
      "/api/telemetry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer gv_node-c4-a1_deadbeef",
        },
        body: JSON.stringify(
          buildReading("Normal", 5004, Math.floor(Date.now() / 1000)),
        ),
      },
      { DB: db },
    );
    expect(res.status).toBe(401);
  });

  it("mints a distinct token every time", async () => {
    const a = await mintToken("NODE-C4-A1");
    const b = await mintToken("NODE-C4-A1");
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});
