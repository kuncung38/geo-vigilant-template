import { describe, expect, it, vi } from "vitest";
import {
  type MapNode,
  nodesNearMedian,
} from "../../src/client/components/TerrainMap";

// Importing the module pulls in maplibre-gl; the camera helper under test is pure.
vi.mock("maplibre-gl", () => ({ default: {} }));

const node = (id: string, latitude: number, longitude: number): MapNode => ({
  id,
  name: id,
  latitude,
  longitude,
  overallCondition: "Normal",
});

describe("nodesNearMedian", () => {
  const westJava = [
    node("cianjur", -6.8168, 107.1425),
    node("sumedang", -6.858, 107.92),
    node("garut", -7.21, 107.9),
  ];

  it("drops a far-flung outlier so it cannot force a whole-globe view", () => {
    // Regression: a seeded "Demo Node" in San Francisco zoomed the production
    // map all the way out, hiding the West Java sensor network.
    const withDemoNode = [...westJava, node("demo", 37.7749, -122.4194)];

    const framed = nodesNearMedian(withDemoNode);

    expect(framed.map((n) => n.id)).toEqual(["cianjur", "sumedang", "garut"]);
  });

  it("keeps every node when the network is genuinely local", () => {
    expect(nodesNearMedian(westJava)).toHaveLength(3);
  });

  it("keeps small sets untouched, since a median is meaningless there", () => {
    const pair = westJava.slice(0, 2);
    expect(nodesNearMedian(pair)).toEqual(pair);
  });

  it("falls back to the full set rather than framing nothing", () => {
    // Three mutually distant nodes: no cluster to prefer, so frame them all.
    const scattered = [
      node("a", -6.8, 107.1),
      node("b", 37.7, -122.4),
      node("c", 51.5, -0.1),
    ];
    expect(nodesNearMedian(scattered).length).toBeGreaterThan(0);
  });
});
