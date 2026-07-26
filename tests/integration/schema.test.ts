import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

describe("Database Schema Integration", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    const migrationPath = path.resolve("drizzle/0000_initial.sql");
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      for (const stmt of sql.split("--> statement-breakpoint")) {
        if (stmt.trim()) db.exec(stmt);
      }
    }
  });

  it("creates monitoring_nodes table with primary key", () => {
    const query = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='monitoring_nodes'",
    );
    expect(query.get()).toBeTruthy();
  });

  it("creates telemetry_logs table with primary key", () => {
    const query = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='telemetry_logs'",
    );
    expect(query.get()).toBeTruthy();
  });

  it("enforces foreign key constraint on telemetry_logs.monitoring_node_id", () => {
    const query = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='telemetry_logs'",
    );
    expect(query.get()).toBeTruthy();

    expect(() => {
      db.exec(`
        INSERT INTO telemetry_logs (
          monitoring_node_id, sequence, device_timestamp, received_at,
          radon_value, radon_condition, radon_min_threshold, radon_max_threshold,
          soil_moisture_value, soil_moisture_condition, soil_moisture_min_threshold, soil_moisture_max_threshold,
          gyro_value, gyro_condition, gyro_min_threshold, gyro_max_threshold,
          rainfall_value, rainfall_condition, rainfall_min_threshold, rainfall_max_threshold,
          overall_condition, is_landslide
        ) VALUES (
          'NON_EXISTENT_NODE', 1, 1000, 1000,
          10, 'Normal', 0, 100,
          10, 'Normal', 0, 100,
          0.1, 'Normal', 0, 1,
          10, 'Normal', 0, 100,
          'Normal', 0
        );
      `);
    }).toThrow(/FOREIGN KEY|constraint/i);
  });

  it("enforces UNIQUE (monitoring_node_id, sequence) on telemetry_logs", () => {
    db.exec(`
      INSERT INTO monitoring_nodes (
        id, name, latitude, longitude, device_token_hash, registered_at, updated_at
      ) VALUES ('NODE-001', 'Test Node', 0.0, 0.0, 'hash', 1000, 1000);
    `);

    const insertLog = () => {
      db.exec(`
        INSERT INTO telemetry_logs (
          monitoring_node_id, sequence, device_timestamp, received_at,
          radon_value, radon_condition, radon_min_threshold, radon_max_threshold,
          soil_moisture_value, soil_moisture_condition, soil_moisture_min_threshold, soil_moisture_max_threshold,
          gyro_value, gyro_condition, gyro_min_threshold, gyro_max_threshold,
          rainfall_value, rainfall_condition, rainfall_min_threshold, rainfall_max_threshold,
          overall_condition, is_landslide
        ) VALUES (
          'NODE-001', 1, 1000, 1000,
          10, 'Normal', 0, 100,
          10, 'Normal', 0, 100,
          0.1, 'Normal', 0, 1,
          10, 'Normal', 0, 100,
          'Normal', 0
        );
      `);
    };

    insertLog();
    expect(() => insertLog()).toThrow(/UNIQUE|constraint/i);
  });

  it("enforces CHECK (condition IN ('Normal', 'Warning', 'Danger'))", () => {
    db.exec(`
      INSERT INTO monitoring_nodes (
        id, name, latitude, longitude, device_token_hash, registered_at, updated_at
      ) VALUES ('NODE-001', 'Test Node', 0.0, 0.0, 'hash', 1000, 1000);
    `);

    expect(() => {
      db.exec(`
        INSERT INTO telemetry_logs (
          monitoring_node_id, sequence, device_timestamp, received_at,
          radon_value, radon_condition, radon_min_threshold, radon_max_threshold,
          soil_moisture_value, soil_moisture_condition, soil_moisture_min_threshold, soil_moisture_max_threshold,
          gyro_value, gyro_condition, gyro_min_threshold, gyro_max_threshold,
          rainfall_value, rainfall_condition, rainfall_min_threshold, rainfall_max_threshold,
          overall_condition, is_landslide
        ) VALUES (
          'NODE-001', 1, 1000, 1000,
          10, 'INVALID_STATUS', 0, 100,
          10, 'Normal', 0, 100,
          0.1, 'Normal', 0, 1,
          10, 'Normal', 0, 100,
          'Normal', 0
        );
      `);
    }).toThrow(/CHECK|constraint/i);
  });

  it("enforces CHECK (min_threshold < max_threshold)", () => {
    db.exec(`
      INSERT INTO monitoring_nodes (
        id, name, latitude, longitude, device_token_hash, registered_at, updated_at
      ) VALUES ('NODE-001', 'Test Node', 0.0, 0.0, 'hash', 1000, 1000);
    `);

    expect(() => {
      db.exec(`
        INSERT INTO telemetry_logs (
          monitoring_node_id, sequence, device_timestamp, received_at,
          radon_value, radon_condition, radon_min_threshold, radon_max_threshold,
          soil_moisture_value, soil_moisture_condition, soil_moisture_min_threshold, soil_moisture_max_threshold,
          gyro_value, gyro_condition, gyro_min_threshold, gyro_max_threshold,
          rainfall_value, rainfall_condition, rainfall_min_threshold, rainfall_max_threshold,
          overall_condition, is_landslide
        ) VALUES (
          'NODE-001', 1, 1000, 1000,
          10, 'Normal', 100, 50,
          10, 'Normal', 0, 100,
          0.1, 'Normal', 0, 1,
          10, 'Normal', 0, 100,
          'Normal', 0
        );
      `);
    }).toThrow(/CHECK|constraint/i);
  });

  it("creates required indexes on monitoring_nodes and telemetry_logs", () => {
    const getIndex = (tableName: string, indexName: string) => {
      const query = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name=?",
      );
      return query.get(tableName, indexName);
    };

    expect(
      getIndex(
        "telemetry_logs",
        "telemetry_logs_monitoring_node_id_received_at_idx",
      ),
    ).toBeTruthy();
    expect(
      getIndex("monitoring_nodes", "monitoring_nodes_overall_condition_idx"),
    ).toBeTruthy();
    expect(
      getIndex("monitoring_nodes", "monitoring_nodes_last_seen_at_idx"),
    ).toBeTruthy();
  });
});
