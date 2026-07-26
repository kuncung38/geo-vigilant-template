import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryLog } from "../api/client";

interface TelemetryChartProps {
  logs: TelemetryLog[] | undefined;
  isLoading: boolean;
}

type SensorType = "radon" | "moisture" | "gyro" | "rainfall";

export function TelemetryChart({ logs = [], isLoading }: TelemetryChartProps) {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("radon");

  if (isLoading) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-on-surface-variant font-data-mono text-sm bg-surface-container-low rounded-xl border border-outline-variant animate-pulse">
        Memuat riwayat telemetri...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center text-on-surface-variant font-data-mono text-sm bg-surface-container-low rounded-xl border border-outline-variant p-6 text-center">
        <span
          className="material-symbols-outlined text-4xl text-outline mb-2"
          data-icon="timeline"
        >
          timeline
        </span>
        <p>Tidak ada data telemetri yang tersedia untuk node ini.</p>
      </div>
    );
  }

  // Sort chronologically ascending for the chart
  const chartData = [...logs]
    .sort((a, b) => a.deviceTimestamp - b.deviceTimestamp)
    .map((log) => {
      const date = new Date(log.deviceTimestamp);
      return {
        timestamp: date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        radon: log.radonValue,
        radonMax: log.radonMaxThreshold,
        moisture: log.soilMoistureValue,
        moistureMax: log.soilMoistureMaxThreshold,
        gyro: log.gyroValue,
        gyroMax: log.gyroMaxThreshold,
        rainfall: log.rainfallValue,
        rainfallMax: log.rainfallMaxThreshold,
      };
    });

  const sensorConfig = {
    radon: {
      label: "Konsentrasi Radon",
      unit: "Bq/m³",
      dataKey: "radon",
      maxKey: "radonMax",
      color: "#10b981",
      icon: "radiation",
    },
    moisture: {
      label: "Kelembaban Tanah",
      unit: "%",
      dataKey: "moisture",
      maxKey: "moistureMax",
      color: "#3b82f6",
      icon: "opacity",
    },
    gyro: {
      label: "Kemiringan Gyro",
      unit: "°/s",
      dataKey: "gyro",
      maxKey: "gyroMax",
      color: "#f59e0b",
      icon: "explore",
    },
    rainfall: {
      label: "Curah Hujan",
      unit: "mm/h",
      dataKey: "rainfall",
      maxKey: "rainfallMax",
      color: "#6366f1",
      icon: "umbrella",
    },
  };

  const currentConfig = sensorConfig[selectedSensor];

  return (
    <div className="space-y-6">
      {/* Sensor Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(sensorConfig) as SensorType[]).map((key) => {
          const config = sensorConfig[key];
          const isSelected = selectedSensor === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedSensor(key)}
              className={`flex items-center gap-3 p-3 rounded-lg border font-bold text-xs transition-all ${
                isSelected
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon={config.icon}>
                {config.icon}
              </span>
              <span className="font-label-caps uppercase tracking-wider text-left">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
              <span>{currentConfig.label}</span>
              <span className="text-xs font-data-mono font-normal text-on-surface-variant">
                ({currentConfig.unit})
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Visualisasi tren sensor waktu nyata dengan ambang batas keselamatan
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-data-mono">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentConfig.color }}
              />
              <span>Pembacaan Aktif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500" />
              <span>Batas Kritis (Max)</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full font-data-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${selectedSensor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="timestamp" stroke="#76777d" tick={{ fontSize: 10 }} />
              <YAxis stroke="#76777d" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#c6c6cd",
                  borderRadius: "0.5rem",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              {chartData.length > 0 &&
                chartData[0][currentConfig.maxKey as keyof (typeof chartData)[0]] !== undefined && (
                  <ReferenceLine
                    y={chartData[0][currentConfig.maxKey as keyof (typeof chartData)[0]] as number}
                    label={{
                      value: "Max Threshold",
                      fill: "#ef4444",
                      fontSize: 10,
                      position: "top",
                    }}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                  />
                )}
              <Area
                type="monotone"
                dataKey={currentConfig.dataKey}
                stroke={currentConfig.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${selectedSensor})`}
                name={currentConfig.label}
                unit={currentConfig.unit}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
