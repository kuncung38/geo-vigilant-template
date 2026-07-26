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

type Condition = "Normal" | "Warning" | "Danger";

/**
 * The West Java landslide corridor this system actually monitors. These mirror
 * the production node registry, so a seeded local database behaves like the
 * deployed one.
 */
const SEED_NODES: ReadonlyArray<{
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  condition: Condition;
}> = [
  {
    id: "NODE-C4-A1",
    name: "Cianjur Sektor 4",
    latitude: -6.8168,
    longitude: 107.1425,
    condition: "Normal",
  },
  {
    id: "NODE-S1-B2",
    name: "Sumedang Zona B",
    latitude: -6.858,
    longitude: 107.92,
    condition: "Warning",
  },
  {
    id: "NODE-G2-D1",
    name: "Garut Sektor Delta",
    latitude: -7.21,
    longitude: 107.9,
    condition: "Danger",
  },
];

const RADON_MAX = 100;
const RADON_DANGER = 350;
const GYRO_MAX = 1;

/** Readings sized to land in the given band, matching the dashboard legend. */
function reading(condition: Condition) {
  switch (condition) {
    case "Danger":
      return {
        radon: RADON_DANGER + 10 + Math.random() * 40,
        moisture: 78 + Math.random() * 8,
        gyro: GYRO_MAX + 0.2 + Math.random() * 0.5,
        rainfall: 11 + Math.random() * 4,
      };
    case "Warning":
      return {
        radon: RADON_MAX + 10 + Math.random() * 30,
        moisture: 62 + Math.random() * 8,
        gyro: 0.4 + Math.random() * 0.3,
        rainfall: 4 + Math.random() * 3,
      };
    default:
      return {
        radon: 40 + Math.random() * 10,
        moisture: 30 + Math.random() * 5,
        gyro: 0.1 + Math.random() * 0.2,
        rainfall: Math.random() * 2,
      };
  }
}

// biome-ignore lint/suspicious/noExplicitAny: db is D1 in the Worker or bun:sqlite locally
export async function seedDatabase(db: any) {
  const now = Math.floor(Date.now() / 1000);
  const baseTime = now - 24 * 3600; // 24 hours of history

  for (const node of SEED_NODES) {
    await db
      .insert(schema.monitoringNodes)
      .values({
        id: node.id,
        name: node.name,
        latitude: node.latitude,
        longitude: node.longitude,
        deviceTokenHash: await sha256(`${node.id}-token`),
        registeredAt: now,
        lastSeenAt: now,
        overallCondition: node.condition,
        updatedAt: now,
      })
      .onConflictDoNothing();

    const logs = [];
    for (let i = 0; i < 24; i++) {
      // Sites sit stable for most of the window and escalate near the end, so
      // the telemetry chart shows a trend rather than a flat line.
      const escalated = i >= 18;
      const condition: Condition = escalated ? node.condition : "Normal";
      const value = reading(condition);
      const isFinalDanger = condition === "Danger" && i === 23;

      logs.push({
        monitoringNodeId: node.id,
        sequence: i + 1,
        deviceTimestamp: baseTime + i * 3600,
        receivedAt: baseTime + i * 3600 + 1,

        radonValue: value.radon,
        radonCondition: condition,
        radonMinThreshold: 0,
        radonMaxThreshold: RADON_MAX,

        soilMoistureValue: value.moisture,
        soilMoistureCondition: condition,
        soilMoistureMinThreshold: 20,
        soilMoistureMaxThreshold: 80,

        gyroValue: value.gyro,
        gyroCondition: condition,
        gyroMinThreshold: -1,
        gyroMaxThreshold: GYRO_MAX,

        rainfallValue: value.rainfall,
        rainfallCondition: condition,
        rainfallMinThreshold: 0,
        rainfallMaxThreshold: 10,

        overallCondition: condition,
        isLandslide: isFinalDanger ? 1 : 0,
      });
    }

    await db.insert(schema.telemetryLogs).values(logs).onConflictDoNothing();
  }
}

// Local CLI execution helper.
// The previous check compared process.argv[1] against the module URL's raw
// pathname. That never matched on Windows ("E:\...\seed.ts" vs "/E:/.../seed.ts")
// and also breaks on any path containing a space, since pathname is
// percent-encoded. fileURLToPath handles both, so use it and compare resolved
// paths — otherwise `bun run db:seed:local` silently seeds nothing.
function isRunDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const { fileURLToPath } = require("node:url");
  const { resolve } = require("node:path");
  const normalize = (p: string) => resolve(p).replace(/\\/g, "/").toLowerCase();
  return normalize(fileURLToPath(import.meta.url)) === normalize(entry);
}

if (isRunDirectly()) {
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
