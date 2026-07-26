import { expect, test } from "@playwright/test";

/**
 * Guards the real 3D map: MapLibre must boot, pull free elevation tiles, and plot
 * live sensor clusters. These assertions fail if the page ever regresses back to a
 * static placeholder image.
 */
test.describe("3D terrain map", () => {
  test("renders MapLibre terrain with free, key-less tile sources", async ({
    page,
  }) => {
    const demRequests: string[] = [];
    const basemapRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("elevation-tiles-prod")) demRequests.push(url);
      if (url.includes("tiles.openfreemap.org")) basemapRequests.push(url);
    });

    await page.goto("/map");

    // MapLibre's WebGL canvas replaces the old background-image div.
    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible();

    // Sensor clusters are real georeferenced markers, not absolutely-positioned divs.
    await expect(page.locator(".gv-marker")).toHaveCount(3);
    await expect(page.getByText("Cianjur Sektor 4").first()).toBeVisible();

    // Elevation data must actually stream in — this is what makes the map 3D.
    await expect
      .poll(() => demRequests.length, { timeout: 20000 })
      .toBeGreaterThan(0);
    expect(basemapRequests.length).toBeGreaterThan(0);

    // No request may carry an API key/token: the whole stack is key-less.
    for (const url of [...demRequests, ...basemapRequests]) {
      expect(url).not.toMatch(/[?&](key|api_key|access_token|token)=/i);
    }

    // Attribution for OSM and the DEM provider must be present (read without
    // toggling the control, which starts expanded).
    const attribution = await page
      .locator(".maplibregl-ctrl-attrib-inner")
      .textContent();
    expect(attribution).toMatch(/OpenStreetMap/i);
    expect(attribution).toMatch(/Terrain Tiles/i);
  });

  test("terrain is pitched in 3D and flattens in 2D", async ({ page }) => {
    await page.goto("/map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await expect(page.locator(".gv-marker").first()).toBeVisible();

    // MapLibre mirrors the camera pitch onto the compass icon's 3D transform.
    const compass = page.locator(
      ".maplibregl-ctrl-compass .maplibregl-ctrl-icon",
    );
    await expect
      .poll(async () => await compass.getAttribute("style"), { timeout: 15000 })
      .toMatch(/rotateX\((?!0deg)/);

    // Relief control is only meaningful while terrain is on.
    await expect(page.getByLabel("Terrain exaggeration")).toBeVisible();

    await page.getByRole("button", { name: "2D", exact: true }).click();

    // Flattening removes the pitch and hides the relief control.
    await expect
      .poll(async () => await compass.getAttribute("style"), { timeout: 15000 })
      .toMatch(/rotateX\(0deg\)/);
    await expect(page.getByLabel("Terrain exaggeration")).toBeHidden();
  });

  test("selecting a cluster reveals its coordinates and telemetry link", async ({
    page,
  }) => {
    await page.goto("/map");
    await expect(page.locator(".gv-marker").first()).toBeVisible();

    await page.locator(".gv-marker").first().click();

    await expect(page.getByText("Selected Cluster")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Open telemetry/i }),
    ).toBeVisible();
  });

  test("deep-linking straight to /map serves the SPA instead of a 404", async ({
    page,
  }) => {
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("Sensor Cluster Network").first(),
    ).toBeVisible();
  });
});
