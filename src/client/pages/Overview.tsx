import { Link } from "react-router-dom";
import { useNodes } from "../hooks/useNodes";

export function Overview() {
  const { data: nodes, isLoading, error } = useNodes();

  const primaryNode = nodes?.[0] || {
    id: "NODE-C4-A1",
    name: "Cianjur Sektor 4",
    latitude: -6.8168,
    longitude: 107.1425,
    overallCondition: "Normal" as const,
  };

  const isSafe = primaryNode.overallCondition === "Normal";
  const isWarning = primaryNode.overallCondition === "Warning";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overall Risk Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface mb-1">
            Status Keamanan: {primaryNode.name} ({primaryNode.id})
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Update terakhir:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            , {new Date().toLocaleTimeString("id-ID")} WIB
          </p>
        </div>
        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-full border ${
            isSafe
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : isWarning
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full animate-pulse ${
              isSafe ? "bg-emerald-500" : isWarning ? "bg-orange-500" : "bg-red-500"
            }`}
          />
          <span className="font-headline-sm font-bold text-lg tracking-wide">
            STATUS: {isSafe ? "AMAN" : isWarning ? "WASPADA" : "BAHAYA"}
          </span>
          <span className="material-symbols-outlined" data-icon="verified_user">
            {isSafe ? "verified_user" : "warning"}
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
            to={`/nodes/${primaryNode.id}`}
            className="text-primary font-bold text-xs hover:underline"
          >
            LIHAT SEMUA NODE &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Radon Gauge */}
          <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-xs font-bold text-on-surface-variant">
                RADON (BQ/M³)
              </span>
              <span className="material-symbols-outlined text-primary" data-icon="radiation">
                mediation
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-surface-container-high"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-emerald-500"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="58"
                    stroke="currentColor"
                    strokeDasharray="364.4"
                    strokeDashoffset="100"
                    strokeWidth="8"
                  />
                </svg>
                <span className="absolute font-data-mono text-3xl font-bold">145</span>
              </div>
              <div className="flex justify-between w-full font-data-mono text-[10px] text-outline">
                <span>MIN: 120</span>
                <span>AMBANG: 400</span>
              </div>
            </div>
          </div>

          {/* Soil Moisture Card */}
          <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-xs font-bold text-on-surface-variant">
                KELEMBABAN TANAH (%)
              </span>
              <span className="material-symbols-outlined text-primary" data-icon="opacity">
                opacity
              </span>
            </div>
            <div className="mt-2">
              <span className="font-data-mono text-3xl font-bold">42.8%</span>
              <div className="w-full h-2 bg-surface-container-high rounded-full mt-4 overflow-hidden">
                <div className="bg-blue-500 h-full w-[42.8%]" />
              </div>
              <div className="mt-4 h-12">
                <div className="w-full h-full opacity-30 flex items-end gap-1">
                  <div className="flex-1 bg-blue-400 h-[60%]" />
                  <div className="flex-1 bg-blue-400 h-[65%]" />
                  <div className="flex-1 bg-blue-400 h-[58%]" />
                  <div className="flex-1 bg-blue-400 h-[70%]" />
                  <div className="flex-1 bg-blue-400 h-[62%]" />
                  <div className="flex-1 bg-blue-400 h-[66%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Gyro Sensor */}
          <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-xs font-bold text-on-surface-variant">
                PERGERAKAN (GYRO)
              </span>
              <span className="material-symbols-outlined text-primary" data-icon="explore">
                explore
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-24 h-24 border-2 border-dashed border-outline-variant rounded-full flex items-center justify-center">
                <div className="w-1 h-16 bg-primary rounded-full transform rotate-12 origin-bottom transition-transform duration-1000" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                </div>
              </div>
              <span className="font-data-mono text-lg font-bold mt-4">0.02° / 0.1°</span>
              <p className="text-[10px] text-on-surface-variant font-bold mt-1">
                Guncangan Terdeteksi: <span className="text-emerald-600">SANGAT RENDAH</span>
              </p>
            </div>
          </div>

          {/* Rainfall Gauge */}
          <div className="metric-card bg-surface-container-lowest p-6 rounded-xl shadow-sm status-safe">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-xs font-bold text-on-surface-variant">
                CURAH HUJAN (MM/H)
              </span>
              <span className="material-symbols-outlined text-primary" data-icon="umbrella">
                umbrella
              </span>
            </div>
            <div className="mt-2">
              <span className="font-data-mono text-3xl font-bold">2.4</span>
              <p className="font-body-md text-on-surface-variant">Hujan Ringan</p>
              <div className="mt-8 grid grid-cols-7 gap-1">
                <div className="h-8 bg-surface-container-high rounded-sm" />
                <div className="h-10 bg-surface-container-high rounded-sm" />
                <div className="h-14 bg-surface-container-high rounded-sm" />
                <div className="h-12 bg-blue-400 rounded-sm" />
                <div className="h-10 bg-blue-300 rounded-sm" />
                <div className="h-16 bg-surface-container-high rounded-sm" />
                <div className="h-8 bg-surface-container-high rounded-sm" />
              </div>
              <p className="text-[10px] text-outline text-center mt-2 font-data-mono">
                Tren 24 Jam
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Data Table */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-headline-sm text-xl font-bold text-on-surface">
              Data Historis & Log Sensor
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm">
              Riwayat pembacaan sensor 24 jam terakhir
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-surface border border-outline-variant rounded-lg text-sm font-semibold px-3 py-1.5 focus:ring-1 focus:ring-primary">
              <option>1 Jam Terakhir</option>
              <option defaultValue="24">24 Jam Terakhir</option>
              <option>7 Hari Terakhir</option>
            </select>
            <button
              type="button"
              className="bg-surface border border-outline-variant p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="filter_list">
                filter_list
              </span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse zebra-table">
            <thead className="sticky-header font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-outline-variant cursor-pointer hover:bg-surface-container-high">
                  TIMESTAMP{" "}
                  <span
                    className="material-symbols-outlined text-[12px]"
                    data-icon="arrow_drop_down"
                  >
                    arrow_drop_down
                  </span>
                </th>
                <th className="px-6 py-4 border-b border-outline-variant">LOKASI</th>
                <th className="px-6 py-4 border-b border-outline-variant">RADON</th>
                <th className="px-6 py-4 border-b border-outline-variant">KELEMBABAN</th>
                <th className="px-6 py-4 border-b border-outline-variant">GYRO</th>
                <th className="px-6 py-4 border-b border-outline-variant">HUJAN</th>
                <th className="px-6 py-4 border-b border-outline-variant text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="font-data-mono text-sm">
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 border-b border-outline-variant">2026-07-26 14:30:00</td>
                <td className="px-6 py-4 border-b border-outline-variant">{primaryNode.id}</td>
                <td className="px-6 py-4 border-b border-outline-variant">145.2</td>
                <td className="px-6 py-4 border-b border-outline-variant">42.8%</td>
                <td className="px-6 py-4 border-b border-outline-variant">0.02°</td>
                <td className="px-6 py-4 border-b border-outline-variant">2.4 mm</td>
                <td className="px-6 py-4 border-b border-outline-variant text-center">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">
                    NORMAL
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 border-b border-outline-variant">2026-07-26 14:15:00</td>
                <td className="px-6 py-4 border-b border-outline-variant">{primaryNode.id}</td>
                <td className="px-6 py-4 border-b border-outline-variant">158.4</td>
                <td className="px-6 py-4 border-b border-outline-variant text-orange-600 font-bold">
                  78.5%
                </td>
                <td className="px-6 py-4 border-b border-outline-variant">0.05°</td>
                <td className="px-6 py-4 border-b border-outline-variant">12.2 mm</td>
                <td className="px-6 py-4 border-b border-outline-variant text-center">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold text-[10px]">
                    WARNING
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 border-b border-outline-variant">2026-07-26 14:00:00</td>
                <td className="px-6 py-4 border-b border-outline-variant">{primaryNode.id}</td>
                <td className="px-6 py-4 border-b border-outline-variant">142.1</td>
                <td className="px-6 py-4 border-b border-outline-variant">41.2%</td>
                <td className="px-6 py-4 border-b border-outline-variant">0.01°</td>
                <td className="px-6 py-4 border-b border-outline-variant">1.8 mm</td>
                <td className="px-6 py-4 border-b border-outline-variant text-center">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">
                    NORMAL
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 border-b border-outline-variant">2026-07-26 13:45:00</td>
                <td className="px-6 py-4 border-b border-outline-variant text-red-600 font-bold">
                  ALERT: {primaryNode.id}
                </td>
                <td className="px-6 py-4 border-b border-outline-variant">412.2</td>
                <td className="px-6 py-4 border-b border-outline-variant">92.1%</td>
                <td className="px-6 py-4 border-b border-outline-variant">1.45°</td>
                <td className="px-6 py-4 border-b border-outline-variant">45.5 mm</td>
                <td className="px-6 py-4 border-b border-outline-variant text-center">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-[10px]">
                    DANGER
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <span className="text-[12px] font-semibold text-on-surface-variant uppercase">
            Menampilkan 4 dari 96 entri
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 border border-outline-variant rounded-lg text-sm bg-white hover:bg-surface-container-low"
            >
              Prev
            </button>
            <button
              type="button"
              className="px-3 py-1 border border-outline-variant rounded-lg text-sm bg-white hover:bg-surface-container-low"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
