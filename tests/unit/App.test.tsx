// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppContent } from "../../src/client/App";

function renderWithProviders(initialRoute = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppContent />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App Component Routing", () => {
  it("renders Overview page on default route /", () => {
    renderWithProviders("/");
    expect(screen.getByText(/Status Keamanan:/i)).toBeTruthy();
  });

  it("renders NodeDetail page on route /nodes/:id", () => {
    renderWithProviders("/nodes/NODE-C4-A1");
    expect(screen.getByText(/Diagnostik Sensor:/i)).toBeTruthy();
  });
});
