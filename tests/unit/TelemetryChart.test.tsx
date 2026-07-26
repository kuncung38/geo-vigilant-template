// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import type { TelemetryLog } from "../../src/client/api/client";
import { TelemetryChart } from "../../src/client/components/TelemetryChart";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const sampleLogs: TelemetryLog[] = [
  {
    id: 1,
    monitoringNodeId: "NODE-001",
    sequence: 1,
    deviceTimestamp: 1716561000000,
    receivedAt: 1716561001000,
    radonValue: 145.2,
    radonCondition: "Normal",
    radonMinThreshold: 0,
    radonMaxThreshold: 400,
    soilMoistureValue: 42.8,
    soilMoistureCondition: "Normal",
    soilMoistureMinThreshold: 20,
    soilMoistureMaxThreshold: 80,
    gyroValue: 0.02,
    gyroCondition: "Normal",
    gyroMinThreshold: -1,
    gyroMaxThreshold: 1,
    rainfallValue: 2.4,
    rainfallCondition: "Normal",
    rainfallMinThreshold: 0,
    rainfallMaxThreshold: 10,
    overallCondition: "Normal",
    isLandslide: 0,
  },
];

describe("TelemetryChart Component", () => {
  it("renders sensor selector tabs and empty state when logs are empty", () => {
    render(<TelemetryChart logs={[]} isLoading={false} />);
    expect(screen.getByText(/Tidak ada data telemetri/i)).toBeTruthy();
  });

  it("renders chart and metric selectors when logs are provided", () => {
    render(<TelemetryChart logs={sampleLogs} isLoading={false} />);
    expect(screen.getAllByText(/Konsentrasi Radon/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Kelembaban Tanah/i)).toBeTruthy();
    expect(screen.getByText(/Kemiringan Gyro/i)).toBeTruthy();
    expect(screen.getByText(/Curah Hujan/i)).toBeTruthy();
  });
});
