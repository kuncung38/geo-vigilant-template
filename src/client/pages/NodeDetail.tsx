import { Link, useParams } from "react-router-dom";
import { TelemetryChart } from "../components/TelemetryChart";
import { useNode } from "../hooks/useNodes";
import { useTelemetry } from "../hooks/useTelemetry";

export function NodeDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    data: node,
    isLoading: isNodeLoading,
    error: nodeError,
  } = useNode(id);
  const { data: telemetryLogs, isLoading: isTelemetryLoading } =
    useTelemetry(id);

  const displayNode = node || {
    id: id || "NODE-C4-A1",
    name: "Cianjur Sektor 4",
    latitude: -6.8168,
    longitude: 107.1425,
    overallCondition: "Normal" as const,
  };

  const isSafe = displayNode.overallCondition === "Normal";
  const isWarning = displayNode.overallCondition === "Warning";

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
            Diagnostik Sensor: {displayNode.name} ({displayNode.id})
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm mt-1">
            Koordinat: {displayNode.latitude}, {displayNode.longitude} |
            Multi-sensor telemetry & alert thresholds
          </p>
        </div>
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-full border font-headline-sm text-sm font-bold ${
            isSafe
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : isWarning
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full animate-pulse ${
              isSafe
                ? "bg-emerald-500"
                : isWarning
                  ? "bg-orange-500"
                  : "bg-red-500"
            }`}
          />
          STATUS: {displayNode.overallCondition.toUpperCase()}
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
        <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
          <h3 className="font-label-caps text-xs text-on-surface-variant">
            KONSENTRASI RADON
          </h3>
          <p className="text-2xl font-bold font-data-mono text-on-surface mt-2">
            {latestLog ? `${latestLog.radonValue} Bq/m³` : "45.2 Bq/m³"}
          </p>
          <div className="mt-2 text-xs text-emerald-600 font-bold">
            {latestLog
              ? `Ambang: ${latestLog.radonMaxThreshold}`
              : "Normal (0 - 100)"}
          </div>
        </div>

        <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
          <h3 className="font-label-caps text-xs text-on-surface-variant">
            KELEMBABAN TANAH
          </h3>
          <p className="text-2xl font-bold font-data-mono text-on-surface mt-2">
            {latestLog ? `${latestLog.soilMoistureValue} %` : "40.5 %"}
          </p>
          <div className="mt-2 text-xs text-emerald-600 font-bold">
            {latestLog
              ? `Ambang: ${latestLog.soilMoistureMaxThreshold}`
              : "Normal (20 - 80)"}
          </div>
        </div>

        <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
          <h3 className="font-label-caps text-xs text-on-surface-variant">
            KEMIRINGAN / GYRO
          </h3>
          <p className="text-2xl font-bold font-data-mono text-on-surface mt-2">
            {latestLog ? `${latestLog.gyroValue} °/s` : "0.15 °/s"}
          </p>
          <div className="mt-2 text-xs text-emerald-600 font-bold">
            {latestLog
              ? `Ambang: ${latestLog.gyroMaxThreshold}`
              : "Normal (-1 - 1)"}
          </div>
        </div>

        <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
          <h3 className="font-label-caps text-xs text-on-surface-variant">
            CURAH HUJAN
          </h3>
          <p className="text-2xl font-bold font-data-mono text-on-surface mt-2">
            {latestLog ? `${latestLog.rainfallValue} mm/h` : "0.5 mm/h"}
          </p>
          <div className="mt-2 text-xs text-emerald-600 font-bold">
            {latestLog
              ? `Ambang: ${latestLog.rainfallMaxThreshold}`
              : "Normal (0 - 10)"}
          </div>
        </div>
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
