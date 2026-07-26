import { useState } from "react";
import { Link } from "react-router-dom";
import { useNodes } from "../hooks/useNodes";

export function MapOverview() {
  const { data: nodes, isLoading, error } = useNodes();
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);

  const displayNodes = nodes || [
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

        {/* Map Background Canvas */}
        <div
          className="w-full h-full grayscale opacity-85 transition-transform duration-300 bg-cover bg-center"
          style={{
            transform: `scale(${zoomLevel})`,
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDV6tLZqc8DFu5R3nhRczCaEKZEeC7OE07FUuDNvzbkKEcYuDFa7oNhhXdbsJ7fWUqa9gAhXbdBK1lgJRLdzobqiM_Ohcvp5MP4gQPOfV4typyv-rnonGYzp2fzkAcHmV9jQlFIe6x_Cxz2Xl9Zntyfeif6CAo4qe6C9szzB_lrlGt9ZpSPSe8BnGGdtw8QEuMWAvtsJZyw7TjSTBCQZ12LIi5-l8F6XKWwtkHdV9colxbOoXCYv7JxHw')`,
            backgroundColor: "#cbdbf5",
          }}
        />

        {/* Interactive Cluster Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {filteredNodes.map((node, index) => {
            const isNormal = node.overallCondition === "Normal";
            const isWarning = node.overallCondition === "Warning";
            const isDanger = node.overallCondition === "Danger";

            // Map markers to distinct canvas quadrants for visual spacing
            const positions = [
              { top: "28%", left: "32%" },
              { top: "52%", left: "58%" },
              { top: "68%", left: "24%" },
              { top: "35%", left: "72%" },
            ];
            const pos = positions[index % positions.length];

            return (
              <Link
                key={node.id}
                to={`/nodes/${node.id}`}
                style={{ top: pos.top, left: pos.left }}
                className={`absolute w-7 h-7 rounded-full border-4 border-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer hover:scale-125 transition-transform ${
                  isNormal
                    ? "bg-emerald-500"
                    : isWarning
                      ? "bg-orange-500"
                      : "bg-red-600 status-pulse"
                }`}
              >
                <span className="absolute -top-9 bg-white/95 px-2.5 py-1 rounded-md text-[11px] font-bold font-data-mono shadow-md border border-outline-variant whitespace-nowrap text-on-surface">
                  {node.name}
                  {isDanger && " ⚠️"}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom-left Cluster Status Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-outline-variant p-4 rounded-lg shadow-sm">
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

        {/* Bottom-right Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
            className="w-10 h-10 bg-white border border-outline-variant rounded-lg flex items-center justify-center text-primary shadow-sm hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined" data-icon="zoom_in">
              zoom_in
            </span>
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="w-10 h-10 bg-white border border-outline-variant rounded-lg flex items-center justify-center text-primary shadow-sm hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined" data-icon="zoom_out">
              zoom_out
            </span>
          </button>
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
