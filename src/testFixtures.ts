import type { Article, Source } from "./types";

export const makeSources = (count: number): Source[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `source-${i + 1}`,
    name: `Source ${i + 1}`,
    description: `Description ${i + 1}`,
    url: `https://example.com/${i + 1}`,
  }));

export const makeArticle = (title = "A headline"): Article => ({
  title,
  author: "An Author",
  description: "A summary",
  url: "https://example.com/article",
  publishedAt: "2026-01-02T03:04:05Z",
});
