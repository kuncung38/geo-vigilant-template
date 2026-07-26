import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MonitoringNode } from "../api/client";
import { conditionStyle } from "../lib/telemetry";

const BASEMAPS = {
  positron: {
    label: "Klinis",
    url: "https://tiles.openfreemap.org/styles/positron",
  },
  liberty: {
    label: "Detail",
    url: "https://tiles.openfreemap.org/styles/liberty",
  },
  bright: {
    label: "Medan",
    url: "https://tiles.openfreemap.org/styles/bright",
  },
} as const;

export type BasemapId = keyof typeof BASEMAPS;

const TERRARIUM_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const DEM_ATTRIBUTION =
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">AWS Terrain Tiles</a> | SRTM, ASTER, GMTED';

const TERRAIN_SOURCE = "geo-vigilant-dem";
const HILLSHADE_SOURCE = "geo-vigilant-dem-hillshade";
const HILLSHADE_LAYER = "geo-vigilant-hillshade";
const RELIEF_LAYER = "geo-vigilant-color-relief";

// Hypsometric ramp, metres above sea level. Sea stays deep so coastline reads,
// then land climbs light and low-chroma: dark basemap labels stay legible over
// it, and saturation is left to the node markers.
const ELEVATION_RAMP: Array<[number, string]> = [
  [0, "#2d4d6b"],
  [40, "#7593a6"],
  [300, "#95acb6"],
  [700, "#aec0c2"],
  [1200, "#c6cfc9"],
  [1800, "#dbded4"],
  [2400, "#ecebe2"],
  [3100, "#fbfaf4"],
];

export interface MapNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  overallCondition: MonitoringNode["overallCondition"];
}

const FALLBACK_CENTER: [number, number] = [107.55, -6.95];

interface TerrainMapProps {
  nodes: MapNode[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: MapNode) => void;
}

export function TerrainMap({
  nodes,
  selectedNodeId,
  onSelectNode,
}: TerrainMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelectNode);
  onSelectRef.current = onSelectNode;

  const [basemap, setBasemap] = useState<BasemapId>("positron");
  const [is3D, setIs3D] = useState(true);
  const [exaggeration, setExaggeration] = useState(1.6);
  const [isReady, setIsReady] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const viewRef = useRef({ is3D, exaggeration });
  viewRef.current = { is3D, exaggeration };

  // setStyle discards sources and layers not in the style document, so terrain,
  // hillshade and sky must be re-applied after every basemap swap.
  const applyTerrain = useCallback(
    (map: maplibregl.Map, exaggerationValue: number, enabled: boolean) => {
      if (!map.getSource(TERRAIN_SOURCE)) {
        map.addSource(TERRAIN_SOURCE, {
          type: "raster-dem",
          tiles: [TERRARIUM_TILES],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
          attribution: DEM_ATTRIBUTION,
        });
      }
      if (!map.getSource(HILLSHADE_SOURCE)) {
        // Carries the DEM attribution: MapLibre only credits sources a visible
        // layer draws from, and the terrain source has no layer of its own.
        map.addSource(HILLSHADE_SOURCE, {
          type: "raster-dem",
          tiles: [TERRARIUM_TILES],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
          attribution: DEM_ATTRIBUTION,
        });
      }

      const firstSymbol = map
        .getStyle()
        .layers?.find((layer) => layer.type === "symbol")?.id;

      // Elevation tint first, relief shading over it, both under the labels.
      if (!map.getLayer(RELIEF_LAYER)) {
        map.addLayer(
          {
            id: RELIEF_LAYER,
            type: "color-relief",
            source: HILLSHADE_SOURCE,
            paint: {
              "color-relief-opacity": 0.9,
              "color-relief-color": [
                "interpolate",
                ["linear"],
                ["elevation"],
                ...ELEVATION_RAMP.flat(),
              ],
            },
          },
          firstSymbol,
        );
      }

      if (!map.getLayer(HILLSHADE_LAYER)) {
        map.addLayer(
          {
            id: HILLSHADE_LAYER,
            type: "hillshade",
            source: HILLSHADE_SOURCE,
            paint: {
              "hillshade-shadow-color": "#16293d",
              "hillshade-highlight-color": "#ffffff",
              "hillshade-accent-color": "#3c5a72",
              "hillshade-exaggeration": 0.7,
              "hillshade-illumination-direction": 315,
            },
          },
          firstSymbol,
        );
      }

      map.setSky({
        "sky-color": "#5b8bc4",
        "sky-horizon-blend": 0.75,
        "horizon-color": "#dce8f5",
        "horizon-fog-blend": 0.7,
        "fog-color": "#c3d5e8",
        "fog-ground-blend": 0.12,
      });

      map.setTerrain(
        enabled
          ? { source: TERRAIN_SOURCE, exaggeration: exaggerationValue }
          : null,
      );
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAPS.positron.url,
        center: FALLBACK_CENTER,
        zoom: 8.4,
        pitch: 62,
        bearing: -17,
        maxPitch: 85,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
      });
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "WebGL is unavailable");
      return;
    }

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right",
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "top-right",
    );
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "top-right",
    );

    map.on("load", () => {
      applyTerrain(map, viewRef.current.exaggeration, viewRef.current.is3D);
      setIsReady(true);
    });

    map.on("error", (event) => {
      if (event.error?.message) setFailure(event.error.message);
    });

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [applyTerrain]);

  const appliedBasemapRef = useRef<BasemapId>("positron");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || appliedBasemapRef.current === basemap) return;
    appliedBasemapRef.current = basemap;
    map.setStyle(BASEMAPS[basemap].url);
    map.once("styledata", () =>
      applyTerrain(map, viewRef.current.exaggeration, viewRef.current.is3D),
    );
  }, [basemap, isReady, applyTerrain]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    map.setTerrain(is3D ? { source: TERRAIN_SOURCE, exaggeration } : null);
    map.easeTo({
      pitch: is3D ? 62 : 0,
      bearing: is3D ? -17 : 0,
      duration: 700,
    });
  }, [is3D, exaggeration, isReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const seen = new Set<string>();

    for (const node of nodes) {
      seen.add(node.id);
      const color = conditionStyle(node.overallCondition).marker;
      const existing = markersRef.current.get(node.id);

      if (existing) {
        existing.setLngLat([node.longitude, node.latitude]);
        const dot = existing
          .getElement()
          .querySelector<HTMLElement>("[data-dot]");
        if (dot) dot.style.backgroundColor = color;
        continue;
      }

      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute(
        "aria-label",
        `${node.name} — ${node.overallCondition}`,
      );
      element.className = "gv-marker";
      element.innerHTML = `
        <span class="gv-marker__label">${escapeHtml(node.name)}</span>
        <span class="gv-marker__dot" data-dot></span>
        <span class="gv-marker__stem"></span>
      `;
      const dot = element.querySelector<HTMLElement>("[data-dot]");
      if (dot) dot.style.backgroundColor = color;
      if (node.overallCondition === "Danger") {
        element.classList.add("gv-marker--alert");
      }

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current?.(node);
        map.flyTo({
          center: [node.longitude, node.latitude],
          zoom: Math.max(map.getZoom(), 12.5),
          pitch: viewRef.current.is3D ? 68 : 0,
          duration: 1200,
        });
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: "bottom",
        // Default is 0.2, which all but hides a node sitting behind a ridge.
        // A sensor in alarm must stay findable; depth is still cued by the fade.
        opacityWhenCovered: "0.72",
      })
        .setLngLat([node.longitude, node.latitude])
        .addTo(map);
      markersRef.current.set(node.id, marker);
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [nodes, isReady]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker
        .getElement()
        .classList.toggle("gv-marker--active", id === selectedNodeId);
    }
  }, [selectedNodeId]);

  const fittedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || fittedRef.current || nodes.length === 0) return;

    const framed = nodesNearMedian(nodes);

    const bounds = new maplibregl.LngLatBounds();
    for (const node of framed) bounds.extend([node.longitude, node.latitude]);
    map.fitBounds(bounds, {
      padding: { top: 140, bottom: 140, left: 120, right: 120 },
      maxZoom: 11,
      pitch: viewRef.current.is3D ? 62 : 0,
      duration: 0,
    });
    fittedRef.current = true;
  }, [nodes, isReady]);

  if (failure && !isReady) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low p-6 text-center">
        <div>
          <p className="font-label-caps text-xs uppercase tracking-wider text-outline">
            Penampil medan tidak tersedia
          </p>
          <p className="font-data-mono mt-2 text-sm text-on-surface-variant">
            {failure}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0"
        data-testid="terrain-map"
      />

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
        <div className="flex overflow-hidden rounded-lg border border-outline-variant bg-white/95 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setIs3D(true)}
            className={`px-3 py-1.5 font-label-caps text-xs uppercase tracking-wider transition-colors ${
              is3D
                ? "bg-primary-container text-white"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setIs3D(false)}
            className={`px-3 py-1.5 font-label-caps text-xs uppercase tracking-wider transition-colors ${
              !is3D
                ? "bg-primary-container text-white"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            2D
          </button>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-outline-variant bg-white/95 shadow-sm backdrop-blur">
          {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setBasemap(id)}
              className={`px-3 py-1.5 font-label-caps text-xs uppercase tracking-wider transition-colors ${
                basemap === id
                  ? "bg-primary-container text-white"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {BASEMAPS[id].label}
            </button>
          ))}
        </div>

        {is3D && (
          <label className="rounded-lg border border-outline-variant bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
            <span className="font-label-caps block text-[10px] uppercase tracking-wider text-outline">
              Relief ×{exaggeration.toFixed(1)}
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.2}
              value={exaggeration}
              onChange={(e) => setExaggeration(Number(e.target.value))}
              className="mt-1 w-28 accent-secondary-container"
              aria-label="Pembesaran relief"
            />
          </label>
        )}
      </div>
    </>
  );
}

export function nodesNearMedian(nodes: MapNode[], maxDegrees = 5): MapNode[] {
  if (nodes.length < 3) return nodes;

  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const medianLat = median(nodes.map((n) => n.latitude));
  const medianLon = median(nodes.map((n) => n.longitude));

  const near = nodes.filter(
    (n) =>
      Math.abs(n.latitude - medianLat) <= maxDegrees &&
      Math.abs(n.longitude - medianLon) <= maxDegrees,
  );

  return near.length > 0 ? near : nodes;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
