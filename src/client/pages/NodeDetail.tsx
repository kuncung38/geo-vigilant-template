import { Link, useParams } from "react-router-dom";

export function NodeDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              &larr; Back to Overview
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mt-2">
            Node Diagnostics: {id}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live multi-sensor telemetry, thresholds, and condition alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            STATUS: NORMAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">
            Radon Concentration
          </h3>
          <p className="text-2xl font-black text-white mt-2">45.2 Bq/m³</p>
          <div className="mt-2 text-xs text-emerald-400">Normal (0 - 100)</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">Soil Moisture</h3>
          <p className="text-2xl font-black text-white mt-2">40.5 %</p>
          <div className="mt-2 text-xs text-emerald-400">Normal (20 - 80)</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">Gyro / Tilt</h3>
          <p className="text-2xl font-black text-white mt-2">0.15 °/s</p>
          <div className="mt-2 text-xs text-emerald-400">Normal (-1 - 1)</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">Rainfall</h3>
          <p className="text-2xl font-black text-white mt-2">0.5 mm/h</p>
          <div className="mt-2 text-xs text-emerald-400">Normal (0 - 10)</div>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          Telemetry History (Live Chart Placeholder)
        </h2>
        <div className="h-64 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center text-slate-500 text-sm">
          Chart visualizations will be initialized in Task 10
        </div>
      </div>
    </div>
  );
}
