import { expect, test } from "@playwright/test";

test("homepage presents the marketplace foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /trusted place/i })).toBeVisible();
});
