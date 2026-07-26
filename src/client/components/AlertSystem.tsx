import { useState } from "react";
import { Link } from "react-router-dom";
import type { MonitoringNode } from "../api/client";

interface AlertSystemProps {
  nodes?: MonitoringNode[];
}

export function AlertSystem({ nodes = [] }: AlertSystemProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const alertNodes = nodes.filter(
    (n) =>
      (n.overallCondition === "Warning" || n.overallCondition === "Danger") &&
      !dismissedIds.includes(n.id),
  );

  if (alertNodes.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full space-y-3 pointer-events-none">
      {alertNodes.map((node) => {
        const isDanger = node.overallCondition === "Danger";
        return (
          <div
            key={node.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in flex flex-col gap-2 ${
              isDanger
                ? "bg-red-950/90 border-red-500 text-red-100 shadow-red-900/30"
                : "bg-orange-950/90 border-orange-500 text-orange-100 shadow-orange-900/30"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-xl ${
                    isDanger ? "text-red-400 animate-bounce" : "text-orange-400"
                  }`}
                  data-icon={isDanger ? "warning" : "error"}
                >
                  {isDanger ? "warning" : "error"}
                </span>
                <div>
                  <h4 className="font-headline-sm text-xs font-bold uppercase tracking-wider">
                    {isDanger ? "PERINGATAN KRITIS (DANGER)" : "PERINGATAN SISTEM (WARNING)"}
                  </h4>
                  <p className="font-body-md text-sm font-bold mt-0.5">{node.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedIds((prev) => [...prev, node.id])}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base" data-icon="close">
                  close
                </span>
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 font-data-mono text-xs">
              <span>ID: {node.id}</span>
              <Link
                to={`/nodes/${node.id}`}
                className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-bold transition-all text-center flex items-center gap-1"
              >
                <span>Diagnostik</span>
                <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
