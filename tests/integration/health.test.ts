import { describe, expect, it } from "vitest";
import { app } from "../../src/server/index";

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /api/unknown", () => {
  it("returns JSON 404 for unknown api routes", async () => {
    const res = await app.request("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "Not Found" });
  });
});
