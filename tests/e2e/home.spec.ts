import { expect, test } from "@playwright/test";

test("opens / and finds GEO-VIGILANT heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /GEO-VIGILANT/i }),
  ).toBeVisible();
});
