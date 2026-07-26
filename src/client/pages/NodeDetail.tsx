import { Link, useParams } from "react-router-dom";
import { TelemetryChart } from "../components/TelemetryChart";
import { useNode } from "../hooks/useNodes";
import { useTelemetry } from "../hooks/useTelemetry";
import { SENSORS, conditionStyle, formatReading } from "../lib/telemetry";

export function NodeDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    data: node,
    isLoading: isNodeLoading,
    error: nodeError,
  } = useNode(id);
  const { data: telemetryLogs, isLoading: isTelemetryLoading } =
    useTelemetry(id);

  // No invented stand-in node: showing a plausible "Normal" placeholder for a
  // node we failed to load would misreport safety.
  const displayNode = node;
  const nodeStyle = conditionStyle(displayNode?.overallCondition);

  // Calculate current readings from latest telemetry log if available
  const latestLog =
    telemetryLogs && telemetryLogs.length > 0 ? telemetryLogs[0] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-primary hover:underline transition-colors font-bold flex items-center gap-1 uppercase tracking-wider"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                data-icon="arrow_back"
              >
                arrow_back
              </span>
              Kembali ke Dashboard
            </Link>
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface mt-2">
            Diagnostik Sensor:{" "}
            {displayNode ? `${displayNode.name} (${displayNode.id})` : id}
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm mt-1">
            {displayNode
              ? `Koordinat: ${displayNode.latitude}, ${displayNode.longitude}`
              : "Koordinat tidak tersedia"}{" "}
            | Telemetri multi-sensor &amp; ambang peringatan
          </p>
        </div>
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-full border font-headline-sm text-sm font-bold ${
            displayNode
              ? nodeStyle.pill
              : "bg-surface-container-low border-outline-variant text-on-surface-variant"
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${
              displayNode ? `animate-pulse ${nodeStyle.dot}` : "bg-outline"
            }`}
          />
          STATUS:{" "}
          {displayNode ? displayNode.overallCondition.toUpperCase() : "—"}
        </div>
      </div>

      {isNodeLoading ? (
        <div className="p-8 text-center text-on-surface-variant font-data-mono">
          Memuat data diagnostik node...
        </div>
      ) : nodeError ? (
        <div className="p-6 bg-error-container text-on-error-container rounded-xl border border-error/20">
          Gagal memuat data node: {nodeError.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SENSORS.map((sensor) => {
          // Colour follows the actual reading. These cards were previously
          // pinned to the "safe" green regardless of the value shown.
          const condition = latestLog ? sensor.condition(latestLog) : undefined;
          const cardStyle = conditionStyle(condition);
          return (
            <div
              key={sensor.key}
              className={`metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm ${
                latestLog ? cardStyle.cardBorder : ""
              }`}
            >
              <h3 className="font-label-caps text-xs text-on-surface-variant">
                {sensor.label.toUpperCase()}
              </h3>
              <p className="text-2xl font-bold font-data-mono text-on-surface mt-2">
                {latestLog
                  ? `${formatReading(sensor.value(latestLog), sensor.digits)} ${sensor.unit}`
                  : "—"}
              </p>
              <div
                className={`mt-2 text-xs font-bold ${
                  latestLog ? cardStyle.text : "text-outline"
                }`}
              >
                {latestLog
                  ? `${cardStyle.label} · Ambang: ${formatReading(sensor.max(latestLog), sensor.digits)}`
                  : "Menunggu pembacaan"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-6">
          Riwayat Telemetri & Analitik Sensor Waktu Nyata
        </h2>
        <TelemetryChart logs={telemetryLogs} isLoading={isTelemetryLoading} />
      </div>
    </div>
  );
}
