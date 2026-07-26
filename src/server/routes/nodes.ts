import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../../db/client";
import { monitoringNodes } from "../../db/schema";
import type { AppEnv } from "../types";

const nodesRoute = new Hono<AppEnv>();

/**
 * getDb() is intentionally untyped so it can back either D1 or bun:sqlite, so
 * annotate query results here to keep the route type-safe — notably ensuring
 * deviceTokenHash is a known field that we strip before responding.
 */
type MonitoringNodeRow = typeof monitoringNodes.$inferSelect;

nodesRoute.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows: MonitoringNodeRow[] = await db.select().from(monitoringNodes);
  const safeRows = rows.map(({ deviceTokenHash, ...rest }) => rest);
  return c.json(safeRows, 200);
});

nodesRoute.get("/:id", async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param("id");
  const [node]: MonitoringNodeRow[] = await db
    .select()
    .from(monitoringNodes)
    .where(eq(monitoringNodes.id, id))
    .limit(1);

  if (!node) {
    return c.json({ error: "Not Found" }, 404);
  }

  const { deviceTokenHash, ...safeNode } = node;
  return c.json(safeNode, 200);
});

export default nodesRoute;
