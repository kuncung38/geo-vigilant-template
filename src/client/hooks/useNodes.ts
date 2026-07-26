import { useQuery } from "@tanstack/react-query";
import { type MonitoringNode, getNode, getNodes } from "../api/client";

export function useNodes() {
  return useQuery<MonitoringNode[], Error>({
    queryKey: ["nodes"],
    queryFn: getNodes,
    refetchInterval: 10000,
  });
}

export function useNode(id: string | undefined) {
  return useQuery<MonitoringNode, Error>({
    queryKey: ["node", id],
    queryFn: () =>
      id ? getNode(id) : Promise.reject(new Error("Missing node id")),
    enabled: Boolean(id),
    refetchInterval: 5000,
  });
}
