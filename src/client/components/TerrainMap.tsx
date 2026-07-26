import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MonitoringNode } from "../api/client";

/**
 * Free, key-less 3D map stack:
 *  - Basemap  : OpenFreeMap vector tiles (OpenStreetMap data, unlimited, no API key)
 *  - Elevation: AWS Open Data "Terrain Tiles" (Tilezen/Mapzen terrarium DEM, no API key)
 * Both are CORS-open and require no account, so nothing here needs a secret.
 */
const BASEMAPS = {
  positron: {
    label: "Clinical",
    url: "https://tiles.openfreemap.org/styles/positron",
  },
  liberty: {
    label: "Detailed",
    url: "https://tiles.openfreemap.org/styles/liberty",
  },
  bright: {
    label: "Terrain",
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

/** The subset of a monitoring node the map actually needs to plot it. */
export interface MapNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  overallCondition: MonitoringNode["overallCondition"];
}

const STATUS_COLOR: Record<MonitoringNode["overallCondition"], string> = {
  Normal: "#10b981",
  Warning: "#f97316",
  Danger: "#dc2626",
};

/** Camera framing for West Java's landslide corridor when no nodes are loaded yet. */
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

  // Latest view settings, readable from callbacks without re-running the setup effects.
  const viewRef = useRef({ is3D, exaggeration });
  viewRef.current = { is3D, exaggeration };

  /**
   * Terrain/hillshade/sky live outside the OpenFreeMap style document, so they must be
   * re-applied every time the style is swapped (setStyle discards custom sources).
   */
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
      // A dedicated source for hillshading keeps relief crisp while terrain is re-tiled.
      // It carries the DEM attribution too: MapLibre only credits sources that a
      // visible layer draws from, and the terrain source has no layer of its own.
      if (!map.getSource(HILLSHADE_SOURCE)) {
        map.addSource(HILLSHADE_SOURCE, {
          type: "raster-dem",
          tiles: [TERRARIUM_TILES],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
          attribution: DEM_ATTRIBUTION,
        });
      }

      if (!map.getLayer(HILLSHADE_LAYER)) {
        // Slide the relief under the first label layer so place names stay readable.
        const firstSymbol = map
          .getStyle()
          .layers?.find((layer) => layer.type === "symbol")?.id;
        map.addLayer(
          {
            id: HILLSHADE_LAYER,
            type: "hillshade",
            source: HILLSHADE_SOURCE,
            paint: {
              "hillshade-shadow-color": "#213145",
              "hillshade-highlight-color": "#f8f9ff",
              "hillshade-accent-color": "#45464d",
              "hillshade-exaggeration": 0.55,
              "hillshade-illumination-direction": 315,
            },
          },
          firstSymbol,
        );
      }

      map.setSky({
        "sky-color": "#8fb4e3",
        "sky-horizon-blend": 0.6,
        "horizon-color": "#d3e4fe",
        "horizon-fog-blend": 0.6,
        "fog-color": "#cbdbf5",
        "fog-ground-blend": 0.05,
      });

      map.setTerrain(
        enabled
          ? { source: TERRAIN_SOURCE, exaggeration: exaggerationValue }
          : null,
      );
    },
    [],
  );

  // Create the map once; style/terrain changes are applied through dedicated effects.
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
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true },
      });
    } catch (err) {
      // Typically a WebGL-unavailable environment (headless browser, blocked GPU).
      setFailure(err instanceof Error ? err.message : "WebGL is unavailable");
      return;
    }

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-right",
    );
    map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

    map.on("load", () => {
      applyTerrain(map, viewRef.current.exaggeration, viewRef.current.is3D);
      setIsReady(true);
    });

    map.on("error", (event) => {
      // Tile hiccups are transient and self-heal; surface only hard style failures.
      if (event.error?.message) setFailure(event.error.message);
    });

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [applyTerrain]);

  // Swap basemap style, then restore terrain (setStyle wipes non-style sources/layers).
  const appliedBasemapRef = useRef<BasemapId>("positron");
  useEffect(() => {
    const map = mapRef.current;
    // Skip the initial pass: the map was constructed with this style already.
    if (!map || !isReady || appliedBasemapRef.current === basemap) return;
    appliedBasemapRef.current = basemap;
    map.setStyle(BASEMAPS[basemap].url);
    map.once("styledata", () =>
      applyTerrain(map, viewRef.current.exaggeration, viewRef.current.is3D),
    );
  }, [basemap, isReady, applyTerrain]);

  // Toggle between the pitched 3D view and a flat operational plan view.
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

  // Sync markers with live node data.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const seen = new Set<string>();

    for (const node of nodes) {
      seen.add(node.id);
      const color = STATUS_COLOR[node.overallCondition];
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

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
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

  // Highlight the active node without re-creating markers.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker
        .getElement()
        .classList.toggle("gv-marker--active", id === selectedNodeId);
    }
  }, [selectedNodeId]);

  // Frame every node once data arrives.
  const fittedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || fittedRef.current || nodes.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const node of nodes) bounds.extend([node.longitude, node.latitude]);
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
            Terrain renderer unavailable
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

      {/* View controls — top right, clear of the legend panels. */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
              aria-label="Terrain exaggeration"
            />
          </label>
        )}
      </div>
    </>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
