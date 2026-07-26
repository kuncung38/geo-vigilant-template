// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/client/api/client";
import { retryUnlessClientError } from "../../src/client/hooks/useNodes";
import { NodeDetail } from "../../src/client/pages/NodeDetail";
import { NotFound } from "../../src/client/pages/NotFound";

describe("NotFound", () => {
  it("offers a way back rather than a dead end", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Kembali ke dasbor/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Lihat semua klaster/i }),
    ).toBeTruthy();
  });

  it("accepts a caller-supplied title and detail", () => {
    render(
      <MemoryRouter>
        <NotFound
          title="Klaster sensor tidak ditemukan"
          detail="ID tidak ada"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Klaster sensor tidak ditemukan")).toBeTruthy();
    expect(screen.getByText("ID tidak ada")).toBeTruthy();
  });
});

describe("NodeDetail for an unknown node", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    global.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "Not Found" }),
    })) as unknown as typeof fetch;
  });

  it("renders the not-found state instead of a half-empty diagnostics page", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/nodes/GHOST"]}>
          <Routes>
            <Route path="/nodes/:id" element={<NodeDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/Klaster sensor tidak ditemukan/i),
    ).toBeTruthy();
    expect(screen.getByText(/GHOST/)).toBeTruthy();
    // The diagnostics shell must not render alongside the error.
    expect(screen.queryByText(/Diagnostik Sensor/i)).toBeNull();
  });
});

describe("retryUnlessClientError", () => {
  it("does not retry a 404 — a missing node stays missing", () => {
    expect(retryUnlessClientError(0, new ApiError(404, "Not Found"))).toBe(
      false,
    );
  });

  it("retries a 500, which may be transient", () => {
    expect(retryUnlessClientError(0, new ApiError(500, "Server Error"))).toBe(
      true,
    );
  });

  it("gives up after a couple of server-side failures", () => {
    expect(retryUnlessClientError(2, new ApiError(500, "Server Error"))).toBe(
      false,
    );
  });
});
