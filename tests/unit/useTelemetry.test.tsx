// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTelemetry } from "../../src/client/hooks/useTelemetry";

const mockTelemetry = [
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

describe("useTelemetry Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/telemetry?nodeId=NODE-001")) {
        return {
          ok: true,
          json: async () => mockTelemetry,
        } as Response;
      }
      return { ok: false, statusText: "Not Found", status: 404 } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches and returns telemetry logs for a given nodeId", async () => {
    const { result } = renderHook(() => useTelemetry("NODE-001"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTelemetry);
    expect(global.fetch).toHaveBeenCalledWith("/api/telemetry?nodeId=NODE-001&limit=50", undefined);
  });
});
