import { Hono } from "hono";
import nodesRoute from "./routes/nodes";
import telemetryRoute from "./routes/telemetry";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/nodes", nodesRoute);
app.route("/api/telemetry", telemetryRoute);

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.text("Not Found", 404);
});

export default app;
export { app };
