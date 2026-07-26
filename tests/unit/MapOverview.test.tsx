// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapOverview } from "../../src/client/pages/MapOverview";

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
    }));
  });

  it("renders the map title, zone markers, and legend", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapOverview />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Sensor Cluster Network/i)).toBeTruthy();
    expect(screen.getByText(/Live Topography/i)).toBeTruthy();
    expect(screen.getByText(/Cluster Status Legend/i)).toBeTruthy();
  });
});
