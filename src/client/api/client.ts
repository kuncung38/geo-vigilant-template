export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(endpoint, options);
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText} (${res.status})`);
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

export async function getNodes(): Promise<MonitoringNode[]> {
  return fetchApi<MonitoringNode[]>("/api/nodes");
}

export async function getNode(id: string): Promise<MonitoringNode> {
  return fetchApi<MonitoringNode>(`/api/nodes/${id}`);
}
