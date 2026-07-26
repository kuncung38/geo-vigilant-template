import { useState } from "react";
import { Link } from "react-router-dom";
import { useNodes } from "../hooks/useNodes";
import { useTelemetry } from "../hooks/useTelemetry";
import {
  SENSORS,
  conditionStyle,
  formatDateTime,
  formatReading,
  thresholdRatio,
} from "../lib/telemetry";

/** Selectable history windows, in hours. */
const RANGES = [
  { label: "1 Jam Terakhir", hours: 1 },
  { label: "24 Jam Terakhir", hours: 24 },
  { label: "7 Hari Terakhir", hours: 24 * 7 },
];

const ROWS_PER_PAGE = 8;

export function Overview() {
  const { data: nodes, isLoading: isNodesLoading, error } = useNodes();
  const [rangeHours, setRangeHours] = useState(24);
  const [page, setPage] = useState(0);

  const primaryNode = nodes?.[0];
  const { data: logs, isLoading: isTelemetryLoading } = useTelemetry(
    primaryNode?.id,
    100,
  );

  const style = conditionStyle(primaryNode?.overallCondition);
  const isLoading = isNodesLoading || isTelemetryLoading;

  // Newest first (the API orders by receivedAt desc), filtered to the window.
  const cutoff = Math.floor(Date.now() / 1000) - rangeHours * 3600;
  const rangedLogs = (logs ?? []).filter((l) => l.deviceTimestamp >= cutoff);
  const latest = rangedLogs[0] ?? logs?.[0];

  const pageCount = Math.max(1, Math.ceil(rangedLogs.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = rangedLogs.slice(
    safePage * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE + ROWS_PER_PAGE,
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overall Risk Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface mb-1">
            Status Keamanan:{" "}
            {primaryNode
              ? `${primaryNode.name} (${primaryNode.id})`
              : "Menunggu data node"}
          </h1>
          <p className="font-body-md text-on-surface-variant">
            {/* Sourced from the reading itself, not the render clock. */}
            {latest
              ? `Update terakhir: ${formatDateTime(latest.receivedAt)} WIB`
              : "Belum ada pembacaan sensor"}
          </p>
        </div>
        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-full border ${style.pill}`}
        >
          <span className={`w-4 h-4 rounded-full animate-pulse ${style.dot}`} />
          <span className="font-headline-sm font-bold text-lg tracking-wide">
            STATUS: {primaryNode ? style.label : "—"}
          </span>
          <span className="material-symbols-outlined">
            {primaryNode?.overallCondition === "Normal"
              ? "verified_user"
              : "warning"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-on-surface-variant font-data-mono">
          Memuat data sensor real-time...
        </div>
      ) : error ? (
        <div className="p-6 bg-error-container text-on-error-container rounded-xl border border-error/20">
          Gagal memuat data node: {error.message}
        </div>
      ) : null}

      {/* Real-Time Sensor Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            SENSOR REAL-TIME
          </h2>
          <Link
            to="/map"
            className="text-primary font-bold text-xs hover:underline"
          >
            LIHAT SEMUA NODE &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SENSORS.map((sensor) => {
            const value = latest ? sensor.value(latest) : undefined;
            const condition = latest ? sensor.condition(latest) : "Normal";
            const sensorStyle = conditionStyle(condition);
            const min = latest ? sensor.min(latest) : 0;
            const max = latest ? sensor.max(latest) : 100;
            const ratio =
              value !== undefined ? thresholdRatio(value, min, max) : 0;

            return (
              <div
                key={sensor.key}
                className={`metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm ${sensorStyle.cardBorder}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-label-caps text-xs font-bold text-on-surface-variant">
                    {sensor.short} ({sensor.unit})
                  </span>
                  <span className="material-symbols-outlined text-primary">
                    {sensor.icon}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-data-mono text-3xl font-bold">
                    {formatReading(value, sensor.digits)}
                  </span>
                  <span className={`text-xs font-bold ${sensorStyle.text}`}>
                    {sensorStyle.label}
                  </span>
                </div>

                {/* Fill tracks the reading against its own safety threshold. */}
                <div className="w-full h-2 bg-surface-container-high rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${sensorStyle.dot}`}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between w-full font-data-mono text-[10px] text-outline mt-2">
                  <span>MIN: {formatReading(min, sensor.digits)}</span>
                  <span>AMBANG: {formatReading(max, sensor.digits)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Data Table */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-headline-sm text-xl font-bold text-on-surface">
              Data Historis &amp; Log Sensor
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm">
              Riwayat pembacaan sensor
              {primaryNode ? ` untuk ${primaryNode.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={rangeHours}
              onChange={(e) => {
                setRangeHours(Number(e.target.value));
                setPage(0);
              }}
              aria-label="Rentang waktu"
              className="bg-surface border border-outline-variant rounded-lg text-sm font-semibold px-3 py-1.5 focus:ring-1 focus:ring-primary"
            >
              {RANGES.map((range) => (
                <option key={range.hours} value={range.hours}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="sticky-header font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-outline-variant">
                  TIMESTAMP
                </th>
                <th className="px-6 py-4 border-b border-outline-variant">
                  LOKASI
                </th>
                {SENSORS.map((sensor) => (
                  <th
                    key={sensor.key}
                    className="px-6 py-4 border-b border-outline-variant"
                  >
                    {sensor.short}
                  </th>
                ))}
                <th className="px-6 py-4 border-b border-outline-variant text-center">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="font-data-mono text-sm">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={SENSORS.length + 3}
                    className="px-6 py-10 text-center text-on-surface-variant"
                  >
                    {isLoading
                      ? "Memuat riwayat sensor..."
                      : "Tidak ada pembacaan pada rentang waktu ini."}
                  </td>
                </tr>
              ) : (
                visibleRows.map((log) => {
                  const rowStyle = conditionStyle(log.overallCondition);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 py-4 border-b border-outline-variant">
                        {formatDateTime(log.deviceTimestamp)}
                      </td>
                      <td className="px-6 py-4 border-b border-outline-variant">
                        {log.monitoringNodeId}
                      </td>
                      {SENSORS.map((sensor) => {
                        const cellStyle = conditionStyle(sensor.condition(log));
                        const isAlert = sensor.condition(log) !== "Normal";
                        return (
                          <td
                            key={sensor.key}
                            className={`px-6 py-4 border-b border-outline-variant ${
                              isAlert ? `${cellStyle.text} font-bold` : ""
                            }`}
                          >
                            {formatReading(sensor.value(log), sensor.digits)}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 border-b border-outline-variant text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[10px] ${rowStyle.chip}`}
                        >
                          {log.overallCondition.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <span className="text-[12px] font-semibold text-on-surface-variant uppercase">
            Menampilkan {visibleRows.length} dari {rangedLogs.length} entri
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 border border-outline-variant rounded-lg text-sm bg-white hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-2 py-1 font-data-mono text-xs text-on-surface-variant">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="px-3 py-1 border border-outline-variant rounded-lg text-sm bg-white hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
