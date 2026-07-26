import { expect, test } from "@playwright/test";

test("GEO-VIGILANT Full SPA E2E Workflow: Dasbor -> Peta Topografi -> Diagnostik Sensor", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("GEO-VIGILANT").first()).toBeVisible();

  await expect(page.getByText("Status Keamanan:").first()).toBeVisible();

  await expect(page.getByText("RADON (Bq/m³)").first()).toBeVisible();
  await expect(page.getByText("KELEMBABAN (%)").first()).toBeVisible();

  await page.getByRole("link", { name: "Topografi" }).first().click();
  await expect(page).toHaveURL(/.*\/map/);

  await expect(page.getByText("Jaringan Klaster Sensor").first()).toBeVisible();

  await expect(page.getByPlaceholder("Cari klaster...")).toBeVisible();

  await expect(
    page.locator("main").getByText("Cianjur Sektor 4").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Klaster Sensor" }).first().click();
  await expect(page).toHaveURL(/.*\/nodes/);

  await expect(page.getByText("Diagnostik Sensor:").first()).toBeVisible();

  await expect(page.getByText("Kembali ke Dashboard").first()).toBeVisible();
});

test("dashboard renders live readings and a working history table", async ({
  page,
}) => {
  await page.goto("/");

  const radonCard = page.locator(".metric-card").first();
  await expect(radonCard).toBeVisible();
  await expect(radonCard.locator(".font-data-mono").first()).not.toHaveText(
    "145",
  );

  await expect(page.getByText("2026-07-26 14:30:00")).toHaveCount(0);

  await expect(page.getByText(/Menampilkan \d+ dari \d+ entri/)).toBeVisible();

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
