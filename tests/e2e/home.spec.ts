import { expect, test } from "@playwright/test";

test("GEO-VIGILANT Full SPA E2E Workflow: Dashboard -> Topography Map -> Sensor Diagnostics", async ({
  page,
}) => {
  // 1. Open Dashboard (/)
  await page.goto("/");

  // Check navbar brand logo
  await expect(page.getByText("GEO-VIGILANT").first()).toBeVisible();

  // Check main dashboard text elements
  await expect(page.getByText("Status Keamanan:").first()).toBeVisible();

  // Check sensor metric card labels exist
  await expect(page.getByText("RADON (BQ/M³)").first()).toBeVisible();
  await expect(page.getByText("KELEMBABAN TANAH (%)").first()).toBeVisible();

  // 2. Navigate client-side to Topography Map (/map) via Navbar
  await page.getByRole("link", { name: "Topography" }).first().click();
  await expect(page).toHaveURL(/.*\/map/);

  // Verify map page title text
  await expect(page.getByText("Sensor Cluster Network").first()).toBeVisible();

  // Verify search input exists
  await expect(page.getByPlaceholder("Search clusters...")).toBeVisible();

  // Verify zone marker names appear (using .first() to prevent strict mode violation)
  await expect(page.getByText("Cianjur Sektor 4").first()).toBeVisible();

  // 3. Navigate client-side to Node Detail (/nodes/NODE-001) via Navbar
  await page.getByRole("link", { name: "Sensor Clusters" }).first().click();
  await expect(page).toHaveURL(/.*\/nodes/);

  // Verify diagnostic text header
  await expect(page.getByText("Diagnostik Sensor:").first()).toBeVisible();

  // Verify back to dashboard link exists
  await expect(page.getByText("Kembali ke Dashboard").first()).toBeVisible();
});
