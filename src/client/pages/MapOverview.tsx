import { Suspense, lazy, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNodes } from "../hooks/useNodes";
import { conditionStyle } from "../lib/telemetry";

const TerrainMap = lazy(() =>
  import("../components/TerrainMap").then((m) => ({ default: m.TerrainMap })),
);

export function MapOverview() {
  const { data: nodes, isLoading, error } = useNodes();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const searchQuery = searchParams.get("q") ?? "";
  const setSearchQuery = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const displayNodes = nodes ?? [];

  const filteredNodes = displayNodes.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedNode =
    filteredNodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">
            Jaringan Klaster Sensor
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Status real-time {displayNodes.length} zona pemantauan geologi.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              filter_list
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-md w-full md:w-72 focus:outline-none focus:border-primary"
              placeholder="Cari klaster..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-surface-container-low rounded-lg text-center font-data-mono text-sm animate-pulse">
          Menyinkronkan klaster sensor langsung...
        </div>
      )}

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-lg font-data-mono text-sm">
          Gagal menyinkronkan koordinat klaster: {error.message}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden h-[600px] relative shadow-sm">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low font-data-mono text-sm animate-pulse">
              Memuat penampil medan...
            </div>
          }
        >
          <TerrainMap
            nodes={filteredNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.id)}
          />
        </Suspense>

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3 max-w-[calc(100%-2rem)]">
          {selectedNode && (
            <div className="w-64 rounded-lg border border-outline-variant bg-white/95 p-4 shadow-md backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-label-caps text-[10px] uppercase tracking-wider text-outline">
                    Klaster Terpilih
                  </p>
                  <p className="font-data-mono text-sm font-bold text-on-surface">
                    {selectedNode.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  aria-label="Hapus pilihan"
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
                      conditionStyle(selectedNode.overallCondition).text
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
                Buka telemetri
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-sm">
        <p className="font-label-caps text-xs font-bold text-outline uppercase tracking-wider">
          Legenda Status Klaster
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-data-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Aktif (0–100 Bq/m³)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Waspada (&gt;100 Bq/m³)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600" />
            <span>Bahaya (&gt;350 Bq/m³ + Kemiringan)</span>
          </div>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
        <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-4">
          Registri Klaster Aktif ({filteredNodes.length} Node)
        </h2>
        {filteredNodes.length === 0 ? (
          <p className="font-data-mono text-sm text-on-surface-variant">
            {isLoading
              ? "Memuat registri klaster..."
              : searchQuery
                ? `Tidak ada klaster yang cocok dengan "${searchQuery}".`
                : "Belum ada klaster sensor terdaftar."}
          </p>
        ) : (
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
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${conditionStyle(node.overallCondition).chip}`}
                >
                  {node.overallCondition.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
