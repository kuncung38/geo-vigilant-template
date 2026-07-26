import type { TelemetryLog } from "../api/client";

export type Condition = "Normal" | "Warning" | "Danger";

export const CONDITION_STYLES: Record<
  Condition,
  {
    label: string;
    dot: string;
    text: string;
    chip: string;
    pill: string;
    cardBorder: string;
    marker: string;
  }
> = {
  Normal: {
    label: "AMAN",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    chip: "bg-emerald-100 text-emerald-700",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
    cardBorder: "status-safe",
    marker: "#10b981",
  },
  Warning: {
    label: "WASPADA",
    dot: "bg-orange-500",
    text: "text-orange-600",
    chip: "bg-orange-100 text-orange-700",
    pill: "bg-orange-50 border-orange-200 text-orange-700",
    cardBorder: "status-warning",
    marker: "#f97316",
  },
  Danger: {
    label: "BAHAYA",
    dot: "bg-red-500",
    text: "text-red-600",
    chip: "bg-red-100 text-red-700",
    pill: "bg-red-50 border-red-200 text-red-700",
    cardBorder: "status-danger",
    marker: "#dc2626",
  },
};

export function conditionStyle(condition: string | undefined) {
  return (
    CONDITION_STYLES[(condition as Condition) ?? "Normal"] ??
    CONDITION_STYLES.Normal
  );
}

export function formatReading(value: number | undefined, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

/** Timestamps are stored as UNIX seconds; Date expects milliseconds. */
export function toDate(unixSeconds: number): Date {
  return new Date(unixSeconds * 1000);
}

export function formatTime(unixSeconds: number): string {
  return toDate(unixSeconds).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(unixSeconds: number): string {
  return toDate(unixSeconds).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SENSORS = [
  {
    key: "radon" as const,
    label: "Konsentrasi Radon",
    short: "RADON",
    unit: "Bq/m³",
    icon: "radiology",
    digits: 1,
    value: (l: TelemetryLog) => l.radonValue,
    max: (l: TelemetryLog) => l.radonMaxThreshold,
    min: (l: TelemetryLog) => l.radonMinThreshold,
    condition: (l: TelemetryLog) => l.radonCondition,
    color: "#10b981",
  },
  {
    key: "moisture" as const,
    label: "Kelembaban Tanah",
    short: "KELEMBABAN",
    unit: "%",
    icon: "humidity_percentage",
    digits: 1,
    value: (l: TelemetryLog) => l.soilMoistureValue,
    max: (l: TelemetryLog) => l.soilMoistureMaxThreshold,
    min: (l: TelemetryLog) => l.soilMoistureMinThreshold,
    condition: (l: TelemetryLog) => l.soilMoistureCondition,
    color: "#3b82f6",
  },
  {
    key: "gyro" as const,
    label: "Kemiringan Gyro",
    short: "GYRO",
    unit: "°/s",
    icon: "explore",
    digits: 2,
    value: (l: TelemetryLog) => l.gyroValue,
    max: (l: TelemetryLog) => l.gyroMaxThreshold,
    min: (l: TelemetryLog) => l.gyroMinThreshold,
    condition: (l: TelemetryLog) => l.gyroCondition,
    color: "#f59e0b",
  },
  {
    key: "rainfall" as const,
    label: "Curah Hujan",
    short: "HUJAN",
    unit: "mm/h",
    icon: "rainy",
    digits: 1,
    value: (l: TelemetryLog) => l.rainfallValue,
    max: (l: TelemetryLog) => l.rainfallMaxThreshold,
    min: (l: TelemetryLog) => l.rainfallMinThreshold,
    condition: (l: TelemetryLog) => l.rainfallCondition,
    color: "#6366f1",
  },
];

export type SensorKey = (typeof SENSORS)[number]["key"];

export function thresholdRatio(
  value: number,
  min: number,
  max: number,
): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
