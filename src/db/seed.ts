import * as schema from "./schema";

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

export async function buildSeedRows(now = Math.floor(Date.now() / 1000)) {
  const baseTime = now - 24 * 3600; // 24 hours of history
  const nodes = [];
  const logs = [];

  for (const node of SEED_NODES) {
    nodes.push({
      id: node.id,
      name: node.name,
      latitude: node.latitude,
      longitude: node.longitude,
      deviceTokenHash: await sha256(`${node.id}-token`),
      registeredAt: now,
      lastSeenAt: now,
      overallCondition: node.condition,
      updatedAt: now,
    });

    for (let i = 0; i < 24; i++) {
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
  }

  return { nodes, logs };
}

// biome-ignore lint/suspicious/noExplicitAny: db is D1 in the Worker or bun:sqlite locally
export async function seedDatabase(db: any) {
  const { nodes, logs } = await buildSeedRows();
  await db.insert(schema.monitoringNodes).values(nodes).onConflictDoNothing();
  await db.insert(schema.telemetryLogs).values(logs).onConflictDoNothing();
}

function sqlValue(value: string | number): string {
  return typeof value === "number"
    ? String(value)
    : `'${value.replace(/'/g, "''")}'`;
}

export async function buildSeedSql(): Promise<string> {
  const { nodes, logs } = await buildSeedRows();
  const statements: string[] = [];

  for (const n of nodes) {
    const cols = Object.keys(n);
    const vals = Object.values(n).map((v) => sqlValue(v as string | number));
    statements.push(
      `INSERT OR IGNORE INTO monitoring_nodes (${cols.map(toSnake).join(",")}) VALUES (${vals.join(",")});`,
    );
  }
  for (const l of logs) {
    const cols = Object.keys(l);
    const vals = Object.values(l).map((v) => sqlValue(v as string | number));
    statements.push(
      `INSERT OR IGNORE INTO telemetry_logs (${cols.map(toSnake).join(",")}) VALUES (${vals.join(",")});`,
    );
  }
  return statements.join("\n");
}

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
