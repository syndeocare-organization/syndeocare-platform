import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Arabic landing page is localized and accessible", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("الرعاية الأفضل");
  await expect(page.getByRole("link", { name: /أنا مقدم رعاية/ })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("English navigation and support page work", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Better care starts");
  await page
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Support" })
    .click();
  await expect(page).toHaveURL(/\/en\/support$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can we help?");
});

test("health endpoint stays explicit when cloud services are absent", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const health = await response.json();
  expect(["ok", "degraded"]).toContain(health.status);
  expect(health.services.web).toBe("up");
});

test("mobile layout does not overflow horizontally", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile project only");
  await page.goto("/ar");
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
