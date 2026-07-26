import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), cloudflare()],
  // @ts-ignore - environments exists in vite 6 with cloudflare plugin
  environments: {
    geo_vigilant: {
      external: ["bun:sqlite", "drizzle-orm/bun-sqlite"],
    },
  },
  ssr: {
    external: ["bun:sqlite", "drizzle-orm/bun-sqlite"],
  },
  optimizeDeps: {
    exclude: ["bun:sqlite", "drizzle-orm/bun-sqlite"],
    esbuildOptions: {
      external: ["bun:sqlite"],
    },
  },
  build: {
    rollupOptions: {
      external: ["bun:sqlite"],
    },
  },
});
