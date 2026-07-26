// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNodes } from "../../src/client/hooks/useNodes";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useNodes Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns list of monitoring nodes", async () => {
    const mockNodes = [
      {
        id: "NODE-C4-A1",
        name: "Cianjur Sektor 4",
        latitude: -6.8168,
        longitude: 107.1425,
        overallCondition: "Normal",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockNodes,
      }),
    );

    const { result } = renderHook(() => useNodes(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNodes);
  });
});
