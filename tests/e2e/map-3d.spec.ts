import { expect, test } from "@playwright/test";

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

    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible();

    const registry = page.getByRole("heading", {
      name: /Registri Klaster Aktif/i,
    });
    const expectedCount = Number(
      (await registry.innerText()).match(/\((\d+) Node\)/)?.[1],
    );
    expect(expectedCount).toBeGreaterThan(0);
    await expect(page.locator(".gv-marker")).toHaveCount(expectedCount);
    await expect(
      page.locator("main").getByText("Cianjur Sektor 4").first(),
    ).toBeVisible();

    await expect
      .poll(() => demRequests.length, { timeout: 20000 })
      .toBeGreaterThan(0);
    expect(basemapRequests.length).toBeGreaterThan(0);

    for (const url of [...demRequests, ...basemapRequests]) {
      expect(url).not.toMatch(/[?&](key|api_key|access_token|token)=/i);
    }

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

    const compass = page.locator(
      ".maplibregl-ctrl-compass .maplibregl-ctrl-icon",
    );
    await expect
      .poll(async () => await compass.getAttribute("style"), { timeout: 15000 })
      .toMatch(/rotateX\((?!0deg)/);

    await expect(page.getByLabel("Pembesaran relief")).toBeVisible();

    await page.getByRole("button", { name: "2D", exact: true }).click();

    await expect
      .poll(async () => await compass.getAttribute("style"), { timeout: 15000 })
      .toMatch(/rotateX\(0deg\)/);
    await expect(page.getByLabel("Pembesaran relief")).toBeHidden();
  });

  test("selecting a cluster reveals its coordinates and telemetry link", async ({
    page,
  }) => {
    await page.goto("/map");
    await expect(page.locator(".gv-marker").first()).toBeVisible();

    await page.locator(".gv-marker").first().click();

    await expect(page.getByText("Klaster Terpilih")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Buka telemetri/i }),
    ).toBeVisible();
  });

  test("deep-linking straight to /map serves the SPA instead of a 404", async ({
    page,
  }) => {
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("Jaringan Klaster Sensor").first(),
    ).toBeVisible();
  });
});
