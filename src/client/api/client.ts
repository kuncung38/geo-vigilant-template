/** Carries the HTTP status so callers can tell "missing" from "broken". */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`API Error: ${statusText} (${status})`);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(endpoint, options);
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface MonitoringNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  registeredAt: number;
  lastSeenAt: number;
  overallCondition: "Normal" | "Warning" | "Danger";
  updatedAt: number;
}

export interface TelemetryLog {
  id: number;
  monitoringNodeId: string;
  sequence: number;
  deviceTimestamp: number;
  receivedAt: number;
  radonValue: number;
  radonCondition: "Normal" | "Warning" | "Danger";
  radonMinThreshold: number;
  radonMaxThreshold: number;
  soilMoistureValue: number;
  soilMoistureCondition: "Normal" | "Warning" | "Danger";
  soilMoistureMinThreshold: number;
  soilMoistureMaxThreshold: number;
  gyroValue: number;
  gyroCondition: "Normal" | "Warning" | "Danger";
  gyroMinThreshold: number;
  gyroMaxThreshold: number;
  rainfallValue: number;
  rainfallCondition: "Normal" | "Warning" | "Danger";
  rainfallMinThreshold: number;
  rainfallMaxThreshold: number;
  overallCondition: "Normal" | "Warning" | "Danger";
  isLandslide: number;
}

export async function getNodes(): Promise<MonitoringNode[]> {
  return fetchApi<MonitoringNode[]>("/api/nodes");
}

export async function getNode(id: string): Promise<MonitoringNode> {
  return fetchApi<MonitoringNode>(`/api/nodes/${id}`);
}

export async function getTelemetry(
  nodeId: string,
  limit = 50,
): Promise<TelemetryLog[]> {
  return fetchApi<TelemetryLog[]>(
    `/api/telemetry?nodeId=${encodeURIComponent(nodeId)}&limit=${limit}`,
  );
}
