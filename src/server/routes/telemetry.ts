import { eq } from "drizzle-orm";
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

telemetryRoute.use("/", authMiddleware);

telemetryRoute.post("/", async (c) => {
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
