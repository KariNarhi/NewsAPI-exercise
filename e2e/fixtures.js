import { test as base, expect } from "@playwright/test";

export const makeSources = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `source-${i + 1}`,
    name: `Source ${i + 1}`,
    description: `Description of source ${i + 1}`,
    url: `https://example.com/${i + 1}`,
  }));

export const makeArticles = (sourceId) => [
  {
    title: `Headline from ${sourceId}`,
    author: "An Author",
    description: "A summary",
    url: `https://example.com/story/${sourceId}`,
    publishedAt: "2026-01-02T03:04:05Z",
  },
];

export const test = base.extend({
  // Mocks everything outside the app. Change the fields before page.goto().
  api: [
    async ({ context }, provide) => {
      const api = {
        sources: makeSources(130),
        articles: makeArticles,
        // { status, message } or "network", per endpoint
        failures: {},
        // Await this before answering, to hold a request open
        gates: {},
        requests: [],
        fontRequests: [],
      };

      await context.route("**/api/news/**", async (route) => {
        const url = new URL(route.request().url());
        const endpoint = url.pathname.split("/").pop();
        const source = url.searchParams.get("sources");
        api.requests.push({ endpoint, source });

        await api.gates[source ?? endpoint];

        const failure = api.failures[endpoint];
        if (failure === "network") return route.abort();
        if (failure) {
          return route.fulfill({
            status: failure.status,
            json: { status: "error", message: failure.message },
          });
        }
        return route.fulfill({
          json:
            endpoint === "sources"
              ? { sources: api.sources }
              : { articles: api.articles(source) },
        });
      });

      // No traffic to Google Fonts, so that the tests also run offline
      await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => {
        api.fontRequests.push(route.request().url());
        return route.abort();
      });
      await context.route("https://example.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Story</h1>" }),
      );

      await provide(api);
    },
    { auto: true },
  ],
});

export const cards = (page) => page.getByRole("main").getByRole("article");

export const pager = (page) =>
  page.getByRole("navigation", { name: "Pagination" });

export const pageButton = (page, name) =>
  pager(page).getByRole("button", { name, exact: true });

export const gate = () => {
  let open;
  const promise = new Promise((resolve) => (open = resolve));
  return { promise, open };
};

export { expect };
