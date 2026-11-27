import type { Page } from "@playwright/test";
import {
  cards,
  expect,
  makeSources,
  pageButton,
  pager,
  test,
} from "./fixtures";

test.beforeEach(({ api }) => {
  api.sources = makeSources(130);
  api.sources[99].name = "The Lighthouse";
  api.sources[100].description = "Maritime reporting from the coast";
});

const searchbox = (page: Page) =>
  page.getByRole("searchbox", { name: "Search sources" });

test("filters by name or description, ignoring case", async ({ page }) => {
  await page.goto("/");

  await searchbox(page).fill("LIGHTHOUSE");
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("1 of 130 sources");

  await searchbox(page).fill("maritime");
  await expect(page.getByRole("heading", { name: "Source 101" })).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
});

test("updates the pagination and returns to page 1", async ({ page }) => {
  await page.goto("/");
  await pageButton(page, "Last page").click();

  // Source 1, 10 to 19 and 100 to 130 (the renamed 100 by its description)
  await searchbox(page).fill("source 1");

  await expect(page.getByRole("status")).toHaveText("42 of 130 sources");
  await expect(pageButton(page, "1")).toHaveAttribute("aria-current", "page");
  await pageButton(page, "Last page").click();
  await expect(pageButton(page, "4")).toHaveAttribute("aria-current", "page");
  await expect(cards(page)).toHaveCount(6);
});

test("says when nothing matches, and clears", async ({ page }) => {
  await page.goto("/");

  await searchbox(page).fill("no such source");
  await expect(page.getByRole("status")).toHaveText(
    "No sources match your search.",
  );
  await expect(cards(page)).toHaveCount(0);
  await expect(pager(page).getByRole("button")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(searchbox(page)).toBeFocused();
  await expect(cards(page)).toHaveCount(12);
});

test("filters as you type without new requests", async ({ page, api }) => {
  await page.goto("/");

  await searchbox(page).pressSequentially("lighthouse");

  await expect(cards(page)).toHaveCount(1);
  expect(api.requests).toHaveLength(1);
});

test("keeps the search across headlines", async ({ page }) => {
  await page.goto("/");
  await searchbox(page).fill("lighthouse");

  await page.getByRole("link", { name: "Top headlines" }).click();
  await page.getByRole("link", { name: "Back to sources" }).click();

  await expect(searchbox(page)).toHaveValue("lighthouse");
  await expect(cards(page)).toHaveCount(1);
});

test("fits a 320 px screen with touch-sized controls", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await searchbox(page).fill("source");

  for (const control of [
    searchbox(page),
    page.getByRole("button", { name: "Clear" }),
  ]) {
    const box = (await control.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(43.5);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});
