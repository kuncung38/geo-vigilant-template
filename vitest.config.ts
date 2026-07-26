import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "treat-bun-builtins-as-external",
      resolveId(source) {
        if (source.startsWith("bun:")) {
          return { id: source, external: true };
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
    ],
  },
});
