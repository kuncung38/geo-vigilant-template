import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const monitoringNodes = sqliteTable(
  "monitoring_nodes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    deviceTokenHash: text("device_token_hash").notNull(),
    registeredAt: integer("registered_at").notNull(),
    lastSeenAt: integer("last_seen_at"),
    overallCondition: text("overall_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).default("Normal"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    overallConditionIdx: index("monitoring_nodes_overall_condition_idx").on(
      table.overallCondition,
    ),
    lastSeenAtIdx: index("monitoring_nodes_last_seen_at_idx").on(
      table.lastSeenAt,
    ),
    conditionCheck: check(
      "monitoring_nodes_overall_condition_check",
      sql`overall_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
  }),
);

export const telemetryLogs = sqliteTable(
  "telemetry_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    monitoringNodeId: text("monitoring_node_id")
      .notNull()
      .references(() => monitoringNodes.id),
    sequence: integer("sequence").notNull(),
    deviceTimestamp: integer("device_timestamp").notNull(),
    receivedAt: integer("received_at").notNull(),

    radonValue: real("radon_value").notNull(),
    radonCondition: text("radon_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).notNull(),
    radonMinThreshold: real("radon_min_threshold").notNull(),
    radonMaxThreshold: real("radon_max_threshold").notNull(),

    soilMoistureValue: real("soil_moisture_value").notNull(),
    soilMoistureCondition: text("soil_moisture_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).notNull(),
    soilMoistureMinThreshold: real("soil_moisture_min_threshold").notNull(),
    soilMoistureMaxThreshold: real("soil_moisture_max_threshold").notNull(),

    gyroValue: real("gyro_value").notNull(),
    gyroCondition: text("gyro_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).notNull(),
    gyroMinThreshold: real("gyro_min_threshold").notNull(),
    gyroMaxThreshold: real("gyro_max_threshold").notNull(),

    rainfallValue: real("rainfall_value").notNull(),
    rainfallCondition: text("rainfall_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).notNull(),
    rainfallMinThreshold: real("rainfall_min_threshold").notNull(),
    rainfallMaxThreshold: real("rainfall_max_threshold").notNull(),

    overallCondition: text("overall_condition", {
      enum: ["Normal", "Warning", "Danger"],
    }).notNull(),
    isLandslide: integer("is_landslide").notNull().default(0),
  },
  (table) => ({
    nodeReceivedIdx: index(
      "telemetry_logs_monitoring_node_id_received_at_idx",
    ).on(table.monitoringNodeId, table.receivedAt),
    nodeSeqUnique: unique(
      "telemetry_logs_monitoring_node_id_sequence_unique",
    ).on(table.monitoringNodeId, table.sequence),
    radonConditionCheck: check(
      "telemetry_logs_radon_condition_check",
      sql`radon_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
    radonThresholdCheck: check(
      "telemetry_logs_radon_threshold_check",
      sql`radon_min_threshold < radon_max_threshold`,
    ),
    soilMoistureConditionCheck: check(
      "telemetry_logs_soil_moisture_condition_check",
      sql`soil_moisture_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
    soilMoistureThresholdCheck: check(
      "telemetry_logs_soil_moisture_threshold_check",
      sql`soil_moisture_min_threshold < soil_moisture_max_threshold`,
    ),
    gyroConditionCheck: check(
      "telemetry_logs_gyro_condition_check",
      sql`gyro_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
    gyroThresholdCheck: check(
      "telemetry_logs_gyro_threshold_check",
      sql`gyro_min_threshold < gyro_max_threshold`,
    ),
    rainfallConditionCheck: check(
      "telemetry_logs_rainfall_condition_check",
      sql`rainfall_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
    rainfallThresholdCheck: check(
      "telemetry_logs_rainfall_threshold_check",
      sql`rainfall_min_threshold < rainfall_max_threshold`,
    ),
    overallConditionCheck: check(
      "telemetry_logs_overall_condition_check",
      sql`overall_condition IN ('Normal', 'Warning', 'Danger')`,
    ),
  }),
);
