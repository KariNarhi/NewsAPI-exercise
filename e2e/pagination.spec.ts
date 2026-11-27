/** Layout and behaviour of the pagination row in real browsers. */

import type { Page } from "@playwright/test";
import {
  cards,
  expect,
  makeSources,
  pageButton,
  pager,
  test,
} from "./fixtures";

// 600 sources make 50 pages, more than fit on any screen
test.beforeEach(({ api }) => {
  api.sources = makeSources(600);
});

/** The page numbers currently shown. */
const numbers = async (page: Page) => {
  const texts = await pager(page).getByRole("button").allTextContents();
  return texts.map(Number).filter(Boolean);
};

/**
 * Measures the buttons: number of rows, whether all are on screen, and the
 * shortest side of the smallest one.
 */
const layout = (page: Page) =>
  pager(page).evaluate((nav) => {
    const rects = [...nav.querySelectorAll("button")].map((button) =>
      button.getBoundingClientRect(),
    );
    return {
      rows: new Set(rects.map((r) => Math.round(r.top))).size,
      inside: rects.every((r) => r.left >= 0 && r.right <= window.innerWidth),
      smallest: Math.round(
        Math.min(...rects.map((r) => Math.min(r.width, r.height))),
      ),
    };
  });

for (const { width, count } of [
  // Expected numbers follow from 44 px buttons and 6 px gaps
  { width: 320, count: 2 },
  { width: 390, count: 3 },
  { width: 768, count: 10 },
  { width: 1280, count: 18 },
]) {
  test(`fits ${count} numbers on one row at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    await expect.poll(async () => (await numbers(page)).length).toBe(count);
    expect(await layout(page)).toEqual({
      rows: 1,
      inside: true,
      smallest: 44,
    });
  });
}

test("moves with the first, previous, next and last buttons", async ({
  page,
}) => {
  await page.goto("/");
  const first = pageButton(page, "First page");
  const previous = pageButton(page, "Previous page");
  const next = pageButton(page, "Next page");
  const last = pageButton(page, "Last page");
  const heading = (n: number) =>
    page.getByRole("heading", { name: `Source ${n}`, exact: true });

  await expect(first).toBeDisabled();
  await expect(previous).toBeDisabled();

  await next.click();
  await expect(heading(13)).toBeVisible();
  await previous.click();
  await expect(heading(1)).toBeVisible();

  await last.click();
  await expect(heading(600)).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(last).toBeDisabled();

  await first.click();
  await expect(heading(1)).toBeVisible();
});

test("keeps the current page inside the number window", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  await expect.poll(() => numbers(page)).toEqual([1, 2, 3]);

  await pageButton(page, "3").click();
  await expect.poll(() => numbers(page)).toEqual([2, 3, 4]);
  await expect(pageButton(page, "3")).toHaveAttribute("aria-current", "page");

  await pageButton(page, "Last page").click();
  await expect.poll(() => numbers(page)).toEqual([48, 49, 50]);
});

test("updates the row when the window is resized", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect.poll(async () => (await numbers(page)).length).toBe(18);

  await page.setViewportSize({ width: 390, height: 800 });

  await expect.poll(async () => (await numbers(page)).length).toBe(3);
  expect((await layout(page)).rows).toBe(1);
});

test("scrolls to the top when the page changes", async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(12);

  // Scroll down to the pager first, so that there is something to undo
  const next = pageButton(page, "Next page");
  await next.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await next.click();

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("has no arrow buttons with a single page", async ({ page, api }) => {
  api.sources = makeSources(5);

  await page.goto("/");

  await expect(cards(page)).toHaveCount(5);
  await expect(pager(page).getByRole("button")).toHaveText(["1"]);
});
