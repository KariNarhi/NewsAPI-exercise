import { cards, expect, test } from "./fixtures";

const failures = [
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
  { name: "a network failure", failure: "network", text: "Network Error" },
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
