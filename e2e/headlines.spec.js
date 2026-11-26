import { cards, expect, gate, pageButton, test } from "./fixtures";

const headlineRequests = (api) =>
  api.requests.filter((request) => request.endpoint === "top-headlines");

test("opens the headlines of a source from its card", async ({ page, api }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Top headlines" }).nth(2).click();

  await expect(page).toHaveURL("/headlines?source=source-3");
  await expect(
    page.getByRole("heading", { name: "Headline from source-3" }),
  ).toBeVisible();
  await expect(page.getByText("An Author")).toBeVisible();
  await expect(page.getByText("2026-01-02")).toBeVisible();
  await expect(page.getByText("A summary")).toBeVisible();
  expect(headlineRequests(api)).toEqual([
    { endpoint: "top-headlines", source: "source-3" },
  ]);
});

test("keeps the sources page across headlines and history", async ({
  page,
}) => {
  await page.goto("/");
  await pageButton(page, "2").click();
  await page.getByRole("link", { name: "Top headlines" }).first().click();
  await expect(page.getByText("Headline from source-13")).toBeVisible();

  await page.getByRole("link", { name: "Back to sources" }).click();
  await expect(pageButton(page, "2")).toHaveAttribute("aria-current", "page");

  await page.goBack();
  await expect(page.getByText("Headline from source-13")).toBeVisible();

  await page.goForward();
  await expect(pageButton(page, "2")).toHaveAttribute("aria-current", "page");
});

test("loads a headlines URL directly and after a reload", async ({ page }) => {
  await page.goto("/headlines?source=source-7");
  await expect(page.getByText("Headline from source-7")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Headline from source-7")).toBeVisible();
});

test("hides the old articles while another source loads", async ({
  page,
  api,
}) => {
  const second = gate();
  api.gates["source-2"] = second.promise;
  await page.goto("/headlines?source=source-1");
  await expect(page.getByText("Headline from source-1")).toBeVisible();

  // The UI has no direct link between two sources, so change the URL the way
  // a history navigation does, without reloading the app
  await page.evaluate(() => {
    window.history.pushState({}, "", "/headlines?source=source-2");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect.poll(() => headlineRequests(api).length).toBe(2);
  await expect(page.getByText("Headline from source-1")).toBeHidden();

  second.open();
  await expect(page.getByText("Headline from source-2")).toBeVisible();
});

test("requests a source with no articles only once", async ({ page, api }) => {
  api.articles = () => [];

  await page.goto("/headlines?source=empty");
  await page.waitForLoadState("networkidle");

  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole("alert")).toBeHidden();
  expect(headlineRequests(api)).toHaveLength(1);
});

test("opens the full story in a new tab", async ({ page }) => {
  await page.goto("/headlines?source=source-1");

  const popup = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Read More" }).click();

  await expect(await popup).toHaveURL("https://example.com/story/source-1");
  await expect(page).toHaveURL("/headlines?source=source-1");
});
