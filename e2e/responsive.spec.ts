import type { Page } from "@playwright/test";
import { cards, expect, makeSources, test } from "./fixtures";

const longUrl = `https://example.com/${"a-very-long-path-".repeat(10)}`;
const arabic = "موقع متخصص في متابعة سوق الأسهم السعودي";

test.beforeEach(({ api }) => {
  api.sources = makeSources(30);
  api.sources[0].url = longUrl;
  api.sources[1].description = arabic;
});

const overflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

for (const path of ["/", "/headlines?source=source-1"]) {
  test(`does not scroll sideways at 320 px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });

    await page.goto(path);
    await expect(cards(page).first()).toBeVisible();

    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test(`has touch-sized controls on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(cards(page).first()).toBeVisible();

    const heights = await page
      .locator("main button, main a.btn, main a.app-card-url, footer a")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );

    expect(heights.length).toBeGreaterThan(0);
    // Allow for sub-pixel rounding
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(43.5);
  });
}

test("cuts a long source URL to one line", async ({ page }) => {
  await page.goto("/");

  const link = page.getByRole("link", { name: longUrl });
  await expect(link).toHaveCSS("text-overflow", "ellipsis");
  expect(
    await link.evaluate((a) => a.scrollWidth > a.clientWidth),
  ).toBeTruthy();
});

test("shows Arabic text from right to left", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(arabic)).toHaveCSS("direction", "rtl");
  await expect(page.getByText("Description of source 1", { exact: true })).toHaveCSS(
    "direction",
    "ltr",
  );
});

test("applies the theme", async ({ page, api }) => {
  await page.goto("/");

  await expect(page.locator("body")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
    "font-family",
    /Bebas Neue/,
  );
  expect(api.fontRequests.join()).toContain("Bebas+Neue");
});
