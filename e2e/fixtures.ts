/**
 * Shared setup of the Playwright tests. Import `test` from here, not from
 * Playwright, so that the News API is always mocked.
 */

import { test as base, expect, type Page } from "@playwright/test";
import type { Article, Source } from "../src/types";

/** Sources numbered from 1. */
export const makeSources = (count: number): Source[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `source-${i + 1}`,
    name: `Source ${i + 1}`,
    description: `Description of source ${i + 1}`,
    url: `https://example.com/${i + 1}`,
  }));

/** One article whose title and URL name its source. */
export const makeArticles = (sourceId: string | null): Article[] => [
  {
    title: `Headline from ${sourceId}`,
    author: "An Author",
    description: "A summary",
    url: `https://example.com/story/${sourceId}`,
    publishedAt: "2026-01-02T03:04:05Z",
  },
];

/** Controls and records of the mocked News API. */
interface Api {
  sources: Source[];
  articles: (source: string | null) => Article[];
  // Keys are endpoint names: "sources" or "top-headlines"
  failures: Record<string, { status: number; message: string } | "network">;
  // Answer an endpoint with exactly this instead, status 200
  raw: Record<string, { contentType: string; body: string }>;
  // Endpoints that never answer
  hanging: Set<string>;
  // Await this before answering, to hold a request open
  // Keyed by source id for headlines, else by endpoint name
  gates: Record<string, Promise<void>>;
  // Every request received, in order
  requests: { endpoint: string; source: string | null }[];
  // Stylesheet URLs the page asked Google Fonts for
  fontRequests: string[];
}

export const test = base.extend<{ api: Api }>({
  // Mocks everything outside the app. Change the fields before page.goto().
  // `auto` applies it even to tests that do not ask for `api`
  api: [
    async ({ context }, provide) => {
      const api: Api = {
        sources: makeSources(130),
        articles: makeArticles,
        failures: {},
        raw: {},
        hanging: new Set(),
        gates: {},
        requests: [],
        fontRequests: [],
      };

      // Routes are on the context, so they also apply to new tabs
      await context.route("**/api/news/**", async (route) => {
        const url = new URL(route.request().url());
        const endpoint = url.pathname.split("/").pop()!;
        const source = url.searchParams.get("sources");
        api.requests.push({ endpoint, source });

        // Hold the response while a test inspects the loading state
        await api.gates[source ?? endpoint];

        // Pick the answer: none, a raw body, a failure or the normal data
        if (api.hanging.has(endpoint)) return;
        if (api.raw[endpoint]) return route.fulfill(api.raw[endpoint]);

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
      // Stands in for the external sites that the cards link to
      await context.route("https://example.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Story</h1>" }),
      );

      await provide(api);
    },
    { auto: true },
  ],
});

/** The cards of sources or articles. */
export const cards = (page: Page) => page.getByRole("main").getByRole("article");

/** The pagination row. */
export const pager = (page: Page) =>
  page.getByRole("navigation", { name: "Pagination" });

/** A pagination button; exact, so that "1" does not match "10". */
export const pageButton = (page: Page, name: string) =>
  pager(page).getByRole("button", { name, exact: true });

/** A promise that the test resolves by calling `open`. */
export const gate = () => {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
};

export { expect };
