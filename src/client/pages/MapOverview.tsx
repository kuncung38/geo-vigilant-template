import { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { useNodes } from "../hooks/useNodes";

// MapLibre is ~800 kB; keep it off the dashboard bundle and load it with this route.
const TerrainMap = lazy(() =>
  import("../components/TerrainMap").then((m) => ({ default: m.TerrainMap })),
);

export function MapOverview() {
  const { data: nodes, isLoading, error } = useNodes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const displayNodes =
    nodes && nodes.length > 0
      ? nodes
      : [
          {
            id: "NODE-C4-A1",
            name: "Cianjur Sektor 4",
            latitude: -6.8168,
            longitude: 107.1425,
            overallCondition: "Normal" as const,
            updatedAt: Date.now(),
          },
          {
            id: "NODE-S1-B2",
            name: "Sumedang Zona B",
            latitude: -6.858,
            longitude: 107.92,
            overallCondition: "Warning" as const,
            updatedAt: Date.now(),
          },
          {
            id: "NODE-G2-D1",
            name: "Garut Sektor Delta",
            latitude: -7.21,
            longitude: 107.9,
            overallCondition: "Danger" as const,
            updatedAt: Date.now(),
          },
        ];

  const filteredNodes = displayNodes.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedNode =
    filteredNodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">
            Sensor Cluster Network
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Real-time status of 24 geological monitoring zones.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              filter_list
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-md w-full md:w-72 focus:outline-none focus:border-primary"
              placeholder="Search clusters..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-surface-container-low rounded-lg text-center font-data-mono text-sm animate-pulse">
          Syncing live sensor clusters from satellite feed...
        </div>
      )}

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-lg font-data-mono text-sm">
          Failed to sync cluster coordinates: {error.message}
        </div>
      )}

      {/* Primary Topographic Map Canvas */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden h-[600px] relative shadow-sm">
        {/* Top-left Legend Panel */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-outline-variant p-3 rounded-lg shadow-sm">
          <p className="font-label-caps text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            Live Topography
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-data-mono">Active (Normal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-data-mono">Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-data-mono">Danger (Alert)</span>
            </div>
          </div>
        </div>

        {/* Real 3D terrain canvas — MapLibre GL over OpenStreetMap + SRTM elevation */}
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low font-data-mono text-sm animate-pulse">
              Loading terrain renderer...
            </div>
          }
        >
          <TerrainMap
            nodes={filteredNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.id)}
          />
        </Suspense>

        {/* Selected cluster readout */}
        {selectedNode && (
          <div className="absolute top-28 left-4 z-10 w-64 rounded-lg border border-outline-variant bg-white/95 p-4 shadow-md backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-wider text-outline">
                  Selected Cluster
                </p>
                <p className="font-data-mono text-sm font-bold text-on-surface">
                  {selectedNode.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Clear selection"
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>
            <dl className="mt-3 space-y-1 font-data-mono text-[11px] text-on-surface-variant">
              <div className="flex justify-between gap-2">
                <dt>ID</dt>
                <dd className="text-on-surface">{selectedNode.id}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Lat</dt>
                <dd className="text-on-surface">
                  {selectedNode.latitude.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Lon</dt>
                <dd className="text-on-surface">
                  {selectedNode.longitude.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd
                  className={
                    selectedNode.overallCondition === "Normal"
                      ? "text-emerald-600"
                      : selectedNode.overallCondition === "Warning"
                        ? "text-orange-600"
                        : "text-red-600"
                  }
                >
                  {selectedNode.overallCondition.toUpperCase()}
                </dd>
              </div>
            </dl>
            <Link
              to={`/nodes/${selectedNode.id}`}
              className="mt-3 block rounded border border-outline-variant px-3 py-1.5 text-center font-label-caps text-[11px] uppercase tracking-wider text-on-surface transition-colors hover:border-primary hover:bg-surface-container-low"
            >
              Open telemetry
            </Link>
          </div>
        )}

        {/* Bottom-left Cluster Status Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur border border-outline-variant p-4 rounded-lg shadow-sm">
          <p className="font-label-caps text-xs font-bold text-outline mb-2 uppercase tracking-wider">
            Cluster Status Legend
          </p>
          <div className="flex flex-col gap-2 font-data-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Active (0–100 Bq/m³)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Warning (&gt;100 Bq/m³)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span>Danger (&gt;350 Bq/m³ + Tilt)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Grid Summary Below Map */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
        <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-4">
          Active Cluster Registry ({filteredNodes.length} Nodes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-data-mono text-sm">
          {filteredNodes.map((node) => (
            <Link
              key={node.id}
              to={`/nodes/${node.id}`}
              className="p-4 rounded-lg border border-outline-variant hover:border-primary transition-all flex justify-between items-center bg-background hover:bg-surface-container-low"
            >
              <div>
                <p className="font-bold text-on-surface">{node.name}</p>
                <p className="text-xs text-outline mt-0.5">ID: {node.id}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  node.overallCondition === "Normal"
                    ? "bg-emerald-100 text-emerald-700"
                    : node.overallCondition === "Warning"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {node.overallCondition.toUpperCase()}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
