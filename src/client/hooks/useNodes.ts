import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  type MonitoringNode,
  getNode,
  getNodes,
} from "../api/client";

/**
 * A 4xx will not become a 2xx on retry, so fail fast: retrying a missing node
 * three times with backoff only delays the not-found state by seconds.
 */
export function retryUnlessClientError(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

export function useNodes() {
  return useQuery<MonitoringNode[], Error>({
    queryKey: ["nodes"],
    queryFn: getNodes,
    refetchInterval: 10000,
    retry: retryUnlessClientError,
  });
}

export function useNode(id: string | undefined) {
  return useQuery<MonitoringNode, Error>({
    queryKey: ["node", id],
    queryFn: () =>
      id ? getNode(id) : Promise.reject(new Error("Missing node id")),
    enabled: Boolean(id),
    refetchInterval: 5000,
    retry: retryUnlessClientError,
  });
}
