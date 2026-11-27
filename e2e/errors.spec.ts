/** Failed requests and unusable data, as the user sees them. */

import { cards, expect, makeArticles, makeSources, test } from "./fixtures";

/** Each kind of failure with the message it should produce. */
const failures: {
  name: string;
  failure: { status: number; message: string } | "network";
  text: string;
}[] = [
  {
    name: "an invalid key",
    failure: { status: 401, message: "Your API key is invalid." },
    text: "Your API key is invalid.",
  },
  {
    name: "a rate limit",
    failure: { status: 429, message: "You have made too many requests." },
    text: "You have made too many requests.",
  },
  {
    name: "a network failure",
    failure: "network",
    text: "No connection. Check your network and try again.",
  },
  {
    name: "a server error",
    failure: { status: 502, message: "" },
    text: "The news service is unavailable (HTTP 502).",
  },
];

for (const { name, failure, text } of failures) {
  test(`explains ${name} on the sources page`, async ({ page, api }) => {
    api.failures.sources = failure;

    await page.goto("/");

    await expect(page.getByRole("alert")).toHaveText(
      `Could not load sources: ${text}`,
    );
    await expect(page.getByText("Loading...")).toBeHidden();
    await expect(cards(page)).toHaveCount(0);
  });

  test(`explains ${name} on the headlines page`, async ({ page, api }) => {
    api.failures["top-headlines"] = failure;

    await page.goto("/headlines?source=source-1");

    await expect(page.getByRole("alert")).toHaveText(
      `Could not load headlines: ${text}`,
    );
    await expect(
      page.getByRole("link", { name: "Back to sources" }),
    ).toBeVisible();
  });
}

// Responses with status 200 that are not News API data
for (const { name, contentType, body } of [
  { name: "an HTML page", contentType: "text/html", body: "<!DOCTYPE html>" },
  { name: "the wrong shape", contentType: "application/json", body: "{}" },
]) {
  test(`survives ${name} in place of data`, async ({ page, api }) => {
    api.raw.sources = { contentType, body };

    await page.goto("/");

    await expect(page.getByRole("alert")).toHaveText(
      "Could not load sources: The news service sent unexpected data.",
    );
    await expect(
      page.getByRole("link", { name: "News from News API" }),
    ).toBeVisible();
  });
}

test("skips invalid sources and shows the rest", async ({ page, api }) => {
  const [first, second, third] = makeSources(3);
  api.sources = [first, { ...second, url: "javascript:alert(1)" }, third];

  await page.goto("/");

  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByRole("alert")).toBeHidden();
});

test("skips invalid articles and shows the rest", async ({ page, api }) => {
  const [article] = makeArticles("source-1");
  api.articles = () => [article, { ...article, title: "", url: "bad" }];

  await page.goto("/headlines?source=source-1");

  await expect(cards(page)).toHaveCount(1);
});

// Waits for the real timeout, so this test is slow by design
test("gives up on a request after ten seconds", async ({ page, api }) => {
  api.hanging.add("sources");

  await page.goto("/");
  await expect(page.getByText("Loading...")).toBeVisible();

  await expect(page.getByRole("alert")).toHaveText(
    "Could not load sources: The request timed out.",
    { timeout: 15_000 },
  );
});

// Retry: fail first, then let the same request succeed
for (const { path, endpoint, count } of [
  { path: "/", endpoint: "sources", count: 12 },
  {
    path: "/headlines?source=source-1",
    endpoint: "top-headlines",
    count: 1,
  },
]) {
  test(`recovers with Try again on ${path}`, async ({ page, api }) => {
    api.failures[endpoint] = "network";
    await page.goto(path);
    const retry = page.getByRole("button", { name: "Try again" });
    await expect(retry).toBeVisible();
    expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);

    delete api.failures[endpoint];
    await retry.click();

    await expect(cards(page)).toHaveCount(count);
    await expect(page.getByRole("alert")).toBeHidden();
    expect(api.requests.filter((r) => r.endpoint === endpoint)).toHaveLength(2);
  });
}
