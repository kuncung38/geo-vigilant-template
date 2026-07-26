// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { MonitoringNode } from "../../src/client/api/client";
import { AlertSystem } from "../../src/client/components/AlertSystem";

const mockNodes: MonitoringNode[] = [
  {
    id: "NODE-C4-A1",
    name: "Cianjur Sektor 4",
    latitude: -6.8168,
    longitude: 107.1425,
    registeredAt: Date.now(),
    lastSeenAt: Date.now(),
    overallCondition: "Normal",
    updatedAt: Date.now(),
  },
  {
    id: "NODE-S1-B2",
    name: "Sumedang Zona B",
    latitude: -6.858,
    longitude: 107.92,
    registeredAt: Date.now(),
    lastSeenAt: Date.now(),
    overallCondition: "Warning",
    updatedAt: Date.now(),
  },
  {
    id: "NODE-G2-D1",
    name: "Garut Sektor Delta",
    latitude: -7.21,
    longitude: 107.9,
    registeredAt: Date.now(),
    lastSeenAt: Date.now(),
    overallCondition: "Danger",
    updatedAt: Date.now(),
  },
];

describe("AlertSystem Component", () => {
  it("renders nothing when all nodes are Normal", () => {
    const { container } = render(
      <MemoryRouter>
        <AlertSystem nodes={[mockNodes[0]]} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders alert notifications for Warning and Danger nodes", () => {
    render(
      <MemoryRouter>
        <AlertSystem nodes={mockNodes} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/PERINGATAN KRITIS/i)).toBeTruthy();
    expect(screen.getByText(/Garut Sektor Delta/i)).toBeTruthy();
    expect(screen.getByText(/Sumedang Zona B/i)).toBeTruthy();
  });
});
