import { useQuery } from "@tanstack/react-query";
import { type TelemetryLog, getTelemetry } from "../api/client";
import { retryUnlessClientError } from "./useNodes";

export function useTelemetry(nodeId: string | undefined, limit = 50) {
  return useQuery<TelemetryLog[], Error>({
    queryKey: ["telemetry", nodeId, limit],
    queryFn: () =>
      nodeId ? getTelemetry(nodeId, limit) : Promise.reject(new Error("No ID")),
    enabled: !!nodeId,
    refetchInterval: 5000,
    retry: retryUnlessClientError,
  });
}
