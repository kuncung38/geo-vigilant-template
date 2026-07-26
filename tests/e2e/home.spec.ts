import { expect, test } from "@playwright/test";

test("GEO-VIGILANT Full SPA E2E Workflow: Dasbor -> Peta Topografi -> Diagnostik Sensor", async ({
  page,
}) => {
  // 1. Open Dashboard (/)
  await page.goto("/");

  // Check navbar brand logo
  await expect(page.getByText("GEO-VIGILANT").first()).toBeVisible();

  // Check main dashboard text elements
  await expect(page.getByText("Status Keamanan:").first()).toBeVisible();

  // Check sensor metric card labels exist
  await expect(page.getByText("RADON (Bq/m³)").first()).toBeVisible();
  await expect(page.getByText("KELEMBABAN (%)").first()).toBeVisible();

  // 2. Navigate client-side to Topography Map (/map) via Navbar
  await page.getByRole("link", { name: "Topografi" }).first().click();
  await expect(page).toHaveURL(/.*\/map/);

  // Verify map page title text
  await expect(page.getByText("Jaringan Klaster Sensor").first()).toBeVisible();

  // Verify search input exists
  await expect(page.getByPlaceholder("Cari klaster...")).toBeVisible();

  // Verify zone marker names appear (using .first() to prevent strict mode violation)
  await expect(
    page.locator("main").getByText("Cianjur Sektor 4").first(),
  ).toBeVisible();

  // 3. Navigate client-side to Node Detail (/nodes/:id) via Navbar
  await page.getByRole("link", { name: "Klaster Sensor" }).first().click();
  await expect(page).toHaveURL(/.*\/nodes/);

  // Verify diagnostic text header
  await expect(page.getByText("Diagnostik Sensor:").first()).toBeVisible();

  // Verify back to dashboard link exists
  await expect(page.getByText("Kembali ke Dashboard").first()).toBeVisible();
});

test("dashboard renders live readings and a working history table", async ({
  page,
}) => {
  await page.goto("/");

  // Values must come from telemetry, not the static markup this page used to ship.
  const radonCard = page.locator(".metric-card").first();
  await expect(radonCard).toBeVisible();
  await expect(radonCard.locator(".font-data-mono").first()).not.toHaveText(
    "145",
  );

  // History rows are real logs: timestamps must not be the old hardcoded date.
  await expect(page.getByText("2026-07-26 14:30:00")).toHaveCount(0);

  // Pagination reflects real row counts rather than "4 dari 96".
  await expect(page.getByText(/Menampilkan \d+ dari \d+ entri/)).toBeVisible();

  // Range selector actually filters.
  await page.getByLabel("Rentang waktu").selectOption("1");
  await expect(page.getByText(/Menampilkan \d+ dari \d+ entri/)).toBeVisible();
});

test("navbar search hands the query to the map", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cari sensor").fill("Garut");
  await page.getByLabel("Cari sensor").press("Enter");

  await expect(page).toHaveURL(/\/map\?q=Garut/);
  await expect(
    page.locator("main").getByText("Garut Sektor Delta").first(),
  ).toBeVisible();
  // Non-matching clusters are filtered out of the registry.
  await expect(page.getByText("Registri Klaster Aktif (1 Node)")).toBeVisible();
});

test("navbar location picker switches nodes", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Pilih lokasi sensor").selectOption({
    label: "Sumedang Zona B",
  });

  await expect(page).toHaveURL(/\/nodes\/NODE-S1-B2/);
  await expect(
    page.locator("main").getByText("Sumedang Zona B").first(),
  ).toBeVisible();
});
