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
  const supportLink = page
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Support" });
  await expect(supportLink).toHaveAttribute("href", "/en/support");
  await page.goto("/en/support");
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

test("account recovery is reachable from sign in", async ({ page }) => {
  await page.goto("/ar/auth/login");
  await page.getByRole("link", { name: "نسيت كلمة المرور؟" }).click();
  await expect(page).toHaveURL(/\/ar\/auth\/forgot-password$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("استعد الوصول إلى حسابك");
  await expect(page.getByRole("button", { name: "إرسال رابط الاستعادة" })).toBeVisible();
});

test("registration makes role, password, and legal choices explicit", async ({ page }) => {
  await page.goto("/ar/auth/register");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ابدأ مع SyndeoCare");
  await expect(page.getByRole("radio", { name: "مقدم رعاية" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "منشأة صحية" })).toBeVisible();
  await expect(page.getByRole("button", { name: "إظهار كلمة المرور" })).toBeVisible();
  await expect(page.getByRole("link", { name: "الشروط" })).toHaveAttribute("href", "/ar/terms");
});

test("email verification guidance has a safe fallback", async ({ page }) => {
  await page.goto("/en/auth/check-email");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check your email");
  await expect(page.getByRole("link", { name: "Change email" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
});

test("terms page is linked and readable", async ({ page }) => {
  await page.goto("/en/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
  await expect(page.getByRole("heading", { level: 2, name: "Safe conduct" })).toBeVisible();
});

test("mobile layout does not overflow horizontally", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile project only");
  await page.goto("/ar");
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
