// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppContent } from "../../src/client/App";

describe("App Component Routing", () => {
  it("renders Overview page on default route /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppContent />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Geotechnical Monitoring Overview/i)).toBeTruthy();
  });

  it("renders NodeDetail page on route /nodes/:id", () => {
    render(
      <MemoryRouter initialEntries={["/nodes/NODE-001"]}>
        <AppContent />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Node Diagnostics: NODE-001/i)).toBeTruthy();
  });
});
