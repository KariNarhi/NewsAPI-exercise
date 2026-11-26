import { cards, expect, gate, test } from "./fixtures";

test("shows the loading text, then twelve sources", async ({ page, api }) => {
  const sources = gate();
  api.gates.sources = sources.promise;

  await page.goto("/");
  await expect(page.getByText("Loading...")).toBeVisible();

  sources.open();
  await expect(cards(page)).toHaveCount(12);
  await expect(page.getByText("Loading...")).toBeHidden();
  expect(api.requests).toEqual([{ endpoint: "sources", source: null }]);
});

for (const { width, columns } of [
  { width: 390, columns: 1 },
  { width: 768, columns: 2 },
  { width: 1280, columns: 3 },
]) {
  test(`fills rows of ${columns} at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(cards(page)).toHaveCount(12);

    const tops = await cards(page).evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().top)),
    );
    const perRow = [...new Set(tops)].map(
      (top) => tops.filter((other) => other === top).length,
    );

    expect(perRow).toEqual(Array(12 / columns).fill(columns));
  });
}

test("links to the source site in a new tab", async ({ page }) => {
  await page.goto("/");

  const link = page.getByRole("link", {
    name: "https://example.com/1",
    exact: true,
  });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");

  const popup = page.waitForEvent("popup");
  await link.click();
  await expect(await popup).toHaveURL("https://example.com/1");
});

test("has a brand link home and a News API link", async ({ page }) => {
  await page.goto("/headlines?source=source-1");

  await expect(
    page.getByRole("link", { name: "Powered by News API" }),
  ).toHaveAttribute("href", "https://newsapi.org/");

  await page.getByRole("link", { name: "News from News API" }).click();
  await expect(page).toHaveURL("/");
  await expect(cards(page)).toHaveCount(12);
});

test("opens headlines with the keyboard", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Top headlines" }).nth(1).focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/headlines?source=source-2");
  await expect(page.getByText("Headline from source-2")).toBeVisible();
});
