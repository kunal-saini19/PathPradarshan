import { test, expect } from "@playwright/test";

test("renders registration shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
});
