/**
 * Stand-in for a field sensor: posts a reading to /api/telemetry exactly as a
 * real node would, using a bearer device token.
 *
 * This is the only way to exercise the ingestion path end-to-end — the dashboard
 * only ever reads. Run it against local dev or the deployed Worker.
 *
 * Usage:
 *   GV_TOKEN=<token> bun scripts/simulate-device.ts <NODE-ID> [--url <base>] [--condition Normal|Warning|Danger] [--watch <seconds>]
 */

type Condition = "Normal" | "Warning" | "Danger";

const THRESHOLDS = {
  radon: { min: 0, max: 100 },
  soilMoisture: { min: 20, max: 80 },
  gyro: { min: -1, max: 1 },
  rainfall: { min: 0, max: 10 },
};

/** Values chosen to land in the requested band, mirroring the seed profiles. */
function sample(condition: Condition) {
  switch (condition) {
    case "Danger":
      return {
        radon: 360 + Math.random() * 40,
        moisture: 78 + Math.random() * 8,
        gyro: 1.2 + Math.random() * 0.5,
        rainfall: 11 + Math.random() * 4,
      };
    case "Warning":
      return {
        radon: 110 + Math.random() * 30,
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

/**
 * Derive a per-sensor condition from its own thresholds rather than trusting the
 * caller, so a device cannot report "Normal" while sending an out-of-range value.
 */
export function classify(
  value: number,
  min: number,
  max: number,
  dangerAt = max * 3.5,
): Condition {
  if (value > dangerAt || value < min) return "Danger";
  if (value > max) return "Warning";
  return "Normal";
}

const RANK: Record<Condition, number> = { Normal: 0, Warning: 1, Danger: 2 };

export function worstCondition(conditions: Condition[]): Condition {
  return conditions.reduce(
    (worst, c) => (RANK[c] > RANK[worst] ? c : worst),
    "Normal" as Condition,
  );
}

export function buildReading(
  condition: Condition,
  sequence: number,
  timestamp: number,
) {
  const v = sample(condition);
  const radonCondition = classify(
    v.radon,
    THRESHOLDS.radon.min,
    THRESHOLDS.radon.max,
    350,
  );
  const soilMoistureCondition = classify(
    v.moisture,
    THRESHOLDS.soilMoisture.min,
    THRESHOLDS.soilMoisture.max,
    90,
  );
  const gyroCondition = classify(
    v.gyro,
    THRESHOLDS.gyro.min,
    THRESHOLDS.gyro.max,
    1,
  );
  const rainfallCondition = classify(
    v.rainfall,
    THRESHOLDS.rainfall.min,
    THRESHOLDS.rainfall.max,
    10,
  );
  const overallCondition = worstCondition([
    radonCondition,
    soilMoistureCondition,
    gyroCondition,
    rainfallCondition,
  ]);

  return {
    sequence,
    deviceTimestamp: timestamp,
    radonValue: Number(v.radon.toFixed(3)),
    radonCondition,
    radonMinThreshold: THRESHOLDS.radon.min,
    radonMaxThreshold: THRESHOLDS.radon.max,
    soilMoistureValue: Number(v.moisture.toFixed(3)),
    soilMoistureCondition,
    soilMoistureMinThreshold: THRESHOLDS.soilMoisture.min,
    soilMoistureMaxThreshold: THRESHOLDS.soilMoisture.max,
    gyroValue: Number(v.gyro.toFixed(3)),
    gyroCondition,
    gyroMinThreshold: THRESHOLDS.gyro.min,
    gyroMaxThreshold: THRESHOLDS.gyro.max,
    rainfallValue: Number(v.rainfall.toFixed(3)),
    rainfallCondition,
    rainfallMinThreshold: THRESHOLDS.rainfall.min,
    rainfallMaxThreshold: THRESHOLDS.rainfall.max,
    overallCondition,
    isLandslide: overallCondition === "Danger" ? 1 : 0,
  };
}

/** Continue the node's existing sequence so the unique (node, sequence) index holds. */
async function nextSequence(baseUrl: string, nodeId: string): Promise<number> {
  const res = await fetch(
    `${baseUrl}/api/telemetry?nodeId=${encodeURIComponent(nodeId)}&limit=1`,
  );
  if (!res.ok) return 1;
  const logs = (await res.json()) as Array<{ sequence: number }>;
  return (logs[0]?.sequence ?? 0) + 1;
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

if (import.meta.main) {
  const nodeId = process.argv[2];
  const token = process.env.GV_TOKEN;
  const baseUrl = (arg("--url", "http://localhost:5173") as string).replace(
    /\/$/,
    "",
  );
  const condition = arg("--condition", "Normal") as Condition;
  const watch = Number(arg("--watch", "0"));

  if (!nodeId || !token) {
    console.error(
      "usage: GV_TOKEN=<token> bun scripts/simulate-device.ts <NODE-ID> [--url <base>] [--condition Normal|Warning|Danger] [--watch <seconds>]",
    );
    process.exit(1);
  }

  const send = async () => {
    const sequence = await nextSequence(baseUrl, nodeId);
    const reading = buildReading(
      condition,
      sequence,
      Math.floor(Date.now() / 1000),
    );
    const res = await fetch(`${baseUrl}/api/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reading),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`✗ ${res.status} ${body}`);
      if (res.status === 401) {
        console.error(
          "  Token rejected — mint one with scripts/mint-device-token.ts",
        );
      }
      return false;
    }
    console.log(
      `✓ ${res.status} seq=${reading.sequence} radon=${reading.radonValue} overall=${reading.overallCondition}`,
    );
    return true;
  };

  const ok = await send();
  if (!ok) process.exit(1);

  if (watch > 0) {
    console.log(`watching: sending every ${watch}s (ctrl-c to stop)`);
    setInterval(send, watch * 1000);
  }
}
