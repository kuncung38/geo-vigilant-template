import * as schema from "./schema";

// Create crypto hash in browser/worker friendly way or fallback to node
async function sha256(message: string) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(message).digest("hex");
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function seedDatabase(db: any) {
  const nodeHash = await sha256("demo-token");

  const now = Math.floor(Date.now() / 1000);

  await db
    .insert(schema.monitoringNodes)
    .values({
      id: "NODE-001",
      name: "Demo Node",
      latitude: 37.7749,
      longitude: -122.4194,
      deviceTokenHash: nodeHash,
      registeredAt: now,
      lastSeenAt: now,
      overallCondition: "Normal",
      updatedAt: now,
    })
    .onConflictDoNothing();

  const logs = [];
  let sequence = 1;
  const baseTime = now - 24 * 3600; // 24 hours ago

  for (let i = 0; i < 24; i++) {
    logs.push({
      monitoringNodeId: "NODE-001",
      sequence: sequence++,
      deviceTimestamp: baseTime + i * 3600,
      receivedAt: baseTime + i * 3600 + 1,

      radonValue: 40 + Math.random() * 10,
      radonCondition: "Normal" as const,
      radonMinThreshold: 0,
      radonMaxThreshold: 100,

      soilMoistureValue: 30 + Math.random() * 5,
      soilMoistureCondition: "Normal" as const,
      soilMoistureMinThreshold: 20,
      soilMoistureMaxThreshold: 80,

      gyroValue: 0.1 + Math.random() * 0.2,
      gyroCondition: "Normal" as const,
      gyroMinThreshold: -1,
      gyroMaxThreshold: 1,

      rainfallValue: Math.random() * 2,
      rainfallCondition: "Normal" as const,
      rainfallMinThreshold: 0,
      rainfallMaxThreshold: 10,

      overallCondition: "Normal" as const,
      isLandslide: 0,
    });
  }

  await db.insert(schema.telemetryLogs).values(logs).onConflictDoNothing();
}

// Local CLI execution helper
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // Try to find the local wrangler database
  let sqliteDbPath =
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx-xxxx-xxxx-xxxx.sqlite";

  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const sqliteFile = files.find((f) => f.endsWith(".sqlite"));
      if (sqliteFile) {
        sqliteDbPath = path.join(dir, sqliteFile);
      }
    }
  } catch (e) {
    // Ignore
  }

  try {
    const sqliteMod = "bun:" + "sqlite";
    const drizzleMod = "drizzle-orm/" + "bun-sqlite";
    const { Database } = require(sqliteMod);
    const { drizzle } = require(drizzleMod);
    const sqliteDb = new Database(sqliteDbPath);
    const localDb = drizzle(sqliteDb, { schema });
    seedDatabase(localDb)
      .then(() => {
        console.log("Database seeded successfully!");
        process.exit(0);
      })
      .catch((err) => {
        console.error("Failed to seed database:", err);
        process.exit(1);
      });
  } catch (e) {
    console.error(
      "Could not open local DB. Run `bun run db:migrate:local` first. Error:",
      (e as Error).message,
    );
    process.exit(1);
  }
}
