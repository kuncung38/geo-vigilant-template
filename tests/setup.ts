/**
 * jsdom lacks the browser APIs MapLibre GL touches at import time (it creates its
 * worker from a Blob URL) and at render time (WebGL). Stub just enough for modules
 * that transitively import maplibre-gl to load; tests that exercise map behaviour
 * mock the module outright, and real rendering is covered by the Playwright suite.
 */
if (typeof window !== "undefined") {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => "blob:maplibre-stub";
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }

  if (!HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = () => null;
  }

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
}
