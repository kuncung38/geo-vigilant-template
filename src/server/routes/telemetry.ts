import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../../db/client";
import { monitoringNodes, telemetryLogs } from "../../db/schema";
import { authMiddleware } from "../auth";
import type { AppEnv } from "../types";

const telemetryRoute = new Hono<AppEnv>();

const telemetrySchema = z.object({
  sequence: z.number().int().positive(),
  deviceTimestamp: z.number().int().positive(),
  radonValue: z.number(),
  radonCondition: z.enum(["Normal", "Warning", "Danger"]),
  radonMinThreshold: z.number(),
  radonMaxThreshold: z.number(),
  soilMoistureValue: z.number(),
  soilMoistureCondition: z.enum(["Normal", "Warning", "Danger"]),
  soilMoistureMinThreshold: z.number(),
  soilMoistureMaxThreshold: z.number(),
  gyroValue: z.number(),
  gyroCondition: z.enum(["Normal", "Warning", "Danger"]),
  gyroMinThreshold: z.number(),
  gyroMaxThreshold: z.number(),
  rainfallValue: z.number(),
  rainfallCondition: z.enum(["Normal", "Warning", "Danger"]),
  rainfallMinThreshold: z.number(),
  rainfallMaxThreshold: z.number(),
  overallCondition: z.enum(["Normal", "Warning", "Danger"]),
  isLandslide: z.number().int().min(0).max(1).optional().default(0),
});

telemetryRoute.get("/", async (c) => {
  const nodeId = c.req.query("nodeId");
  if (!nodeId) {
    return c.json({ error: "Missing nodeId query param" }, 400);
  }

  let limit = Number.parseInt(c.req.query("limit") || "50", 10);
  if (Number.isNaN(limit) || limit <= 0) limit = 50;
  if (limit > 100) limit = 100;

  const db = getDb(c.env.DB);

  // An unknown node is 404, not an empty list: [] must mean "node exists, no
  // readings yet" so the client can tell a decommissioned node from a quiet one.
  const [node] = await db
    .select({ id: monitoringNodes.id })
    .from(monitoringNodes)
    .where(eq(monitoringNodes.id, nodeId))
    .limit(1);
  if (!node) {
    return c.json({ error: "Not Found" }, 404);
  }

  const logs = await db
    .select()
    .from(telemetryLogs)
    .where(eq(telemetryLogs.monitoringNodeId, nodeId))
    .orderBy(desc(telemetryLogs.receivedAt))
    .limit(limit);

  return c.json(logs, 200);
});

telemetryRoute.post("/", authMiddleware, async (c) => {
  let json: unknown;
  try {
    json = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const result = telemetrySchema.safeParse(json);
  if (!result.success) {
    return c.json({ error: "Bad Request", details: result.error.errors }, 400);
  }

  const data = result.data;
  const nodeId = c.get("nodeId");
  const now = Math.floor(Date.now() / 1000);
  const db = getDb(c.env.DB);

  try {
    await db.insert(telemetryLogs).values({
      monitoringNodeId: nodeId,
      sequence: data.sequence,
      deviceTimestamp: data.deviceTimestamp,
      receivedAt: now,
      radonValue: data.radonValue,
      radonCondition: data.radonCondition,
      radonMinThreshold: data.radonMinThreshold,
      radonMaxThreshold: data.radonMaxThreshold,
      soilMoistureValue: data.soilMoistureValue,
      soilMoistureCondition: data.soilMoistureCondition,
      soilMoistureMinThreshold: data.soilMoistureMinThreshold,
      soilMoistureMaxThreshold: data.soilMoistureMaxThreshold,
      gyroValue: data.gyroValue,
      gyroCondition: data.gyroCondition,
      gyroMinThreshold: data.gyroMinThreshold,
      gyroMaxThreshold: data.gyroMaxThreshold,
      rainfallValue: data.rainfallValue,
      rainfallCondition: data.rainfallCondition,
      rainfallMinThreshold: data.rainfallMinThreshold,
      rainfallMaxThreshold: data.rainfallMaxThreshold,
      overallCondition: data.overallCondition,
      isLandslide: data.isLandslide,
    });

    await db
      .update(monitoringNodes)
      .set({
        lastSeenAt: now,
        overallCondition: data.overallCondition,
        updatedAt: now,
      })
      .where(eq(monitoringNodes.id, nodeId));

    return c.json({ success: true }, 201);
  } catch (err) {
    return c.json(
      { error: "Database Error", details: (err as Error).message },
      500,
    );
  }
});

export default telemetryRoute;
