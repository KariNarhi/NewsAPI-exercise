import { test as base, expect, type Page } from "@playwright/test";
import type { Article, Source } from "../src/types";

export const makeSources = (count: number): Source[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `source-${i + 1}`,
    name: `Source ${i + 1}`,
    description: `Description of source ${i + 1}`,
    url: `https://example.com/${i + 1}`,
  }));

export const makeArticles = (sourceId: string | null): Article[] => [
  {
    title: `Headline from ${sourceId}`,
    author: "An Author",
    description: "A summary",
    url: `https://example.com/story/${sourceId}`,
    publishedAt: "2026-01-02T03:04:05Z",
  },
];

interface Api {
  sources: Source[];
  articles: (source: string | null) => Article[];
  // Per endpoint
  failures: Record<string, { status: number; message: string } | "network">;
  // Answer an endpoint with exactly this instead, status 200
  raw: Record<string, { contentType: string; body: string }>;
  // Endpoints that never answer
  hanging: Set<string>;
  // Await this before answering, to hold a request open
  gates: Record<string, Promise<void>>;
  requests: { endpoint: string; source: string | null }[];
  fontRequests: string[];
}

export const test = base.extend<{ api: Api }>({
  // Mocks everything outside the app. Change the fields before page.goto().
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

      await context.route("**/api/news/**", async (route) => {
        const url = new URL(route.request().url());
        const endpoint = url.pathname.split("/").pop()!;
        const source = url.searchParams.get("sources");
        api.requests.push({ endpoint, source });

        await api.gates[source ?? endpoint];

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
      await context.route("https://example.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Story</h1>" }),
      );

      await provide(api);
    },
    { auto: true },
  ],
});

export const cards = (page: Page) => page.getByRole("main").getByRole("article");

export const pager = (page: Page) =>
  page.getByRole("navigation", { name: "Pagination" });

export const pageButton = (page: Page, name: string) =>
  pager(page).getByRole("button", { name, exact: true });

export const gate = () => {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
};

export { expect };
