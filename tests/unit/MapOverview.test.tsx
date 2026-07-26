// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapOverview } from "../../src/client/pages/MapOverview";

vi.mock("maplibre-gl", () => {
  class FakeMarker {
    private element = document.createElement("div");
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {
      return this;
    }
    getElement() {
      return this.element;
    }
  }
  class FakeMap {
    on() {
      return this;
    }
    once() {
      return this;
    }
    addControl() {
      return this;
    }
    remove() {
      return this;
    }
    getStyle() {
      return { layers: [] };
    }
    getSource() {
      return undefined;
    }
    addSource() {
      return this;
    }
    addLayer() {
      return this;
    }
    setTerrain() {
      return this;
    }
    setSky() {
      return this;
    }
    setStyle() {
      return this;
    }
    easeTo() {
      return this;
    }
    flyTo() {
      return this;
    }
    fitBounds() {
      return this;
    }
    getZoom() {
      return 8;
    }
  }
  class FakeBounds {
    extend() {
      return this;
    }
  }
  return {
    default: {
      Map: FakeMap,
      Marker: FakeMarker,
      LngLatBounds: FakeBounds,
      NavigationControl: class {},
      ScaleControl: class {},
      FullscreenControl: class {},
      AttributionControl: class {},
    },
  };
});

describe("MapOverview Page Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    global.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => [
        {
          id: "NODE-C4-A1",
          name: "Cianjur Sektor 4",
          latitude: -6.8168,
          longitude: 107.1425,
          overallCondition: "Normal",
          updatedAt: Date.now(),
        },
        {
          id: "NODE-S1-B2",
          name: "Sumedang Zona B",
          latitude: -6.858,
          longitude: 107.92,
          overallCondition: "Warning",
          updatedAt: Date.now(),
        },
        {
          id: "NODE-G2-D1",
          name: "Garut Sektor Delta",
          latitude: -7.21,
          longitude: 107.9,
          overallCondition: "Danger",
          updatedAt: Date.now(),
        },
      ],
    })) as unknown as typeof fetch;
  });

  it("renders the map title and the status legend", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapOverview />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Jaringan Klaster Sensor/i)).toBeTruthy();
    expect(screen.getByText(/Legenda Status Klaster/i)).toBeTruthy();
  });

  it("mounts the terrain map canvas with 3D and basemap controls", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapOverview />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId("terrain-map")).toBeTruthy();
    expect(screen.getByRole("button", { name: "3D" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2D" })).toBeTruthy();
  });

  it("no longer renders the static placeholder basemap image", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapOverview />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.innerHTML).not.toContain("googleusercontent.com");
  });
});
