import { Link } from "react-router-dom";

export function Overview() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl shadow-cyan-950/10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Geotechnical Monitoring Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time environmental telemetry, soil dynamics, and early hazard
            detection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            LIVE FEED ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">Active Nodes</h3>
          <p className="text-3xl font-black text-white mt-2">1</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
            <span>100% Operational</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">
            Global Risk Assessment
          </h3>
          <p className="text-3xl font-black text-emerald-400 mt-2">NORMAL</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span>All sensors within nominal limits</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium">Telemetry Rate</h3>
          <p className="text-3xl font-black text-cyan-400 mt-2">60s</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span>High-frequency polling enabled</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Quick Node Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/nodes/NODE-001"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 flex items-center justify-between group"
          >
            <div>
              <h4 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                Demo Node (NODE-001)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Lat: 37.7749, Lon: -122.4194
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Normal
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
