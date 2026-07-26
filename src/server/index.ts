import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.text("Not Found", 404);
});

export default app;
export { app };
