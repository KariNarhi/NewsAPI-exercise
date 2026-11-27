import axios from "axios";
import { afterEach, beforeEach, expect, test, vi, type Mock } from "vitest";
import { fetchArticles, fetchSources, TIMEOUT_MS, UNEXPECTED_DATA } from "./api";
import { makeArticle, makeSources } from "./testFixtures";

vi.mock("axios");
const get = axios.get as Mock;

const respond = (data: unknown) => get.mockResolvedValue({ data });
const [source] = makeSources(1);

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

test("requests with a timeout", async () => {
  respond({ sources: [], articles: [] });

  await fetchSources();
  await fetchArticles("abc");

  expect(get).toHaveBeenNthCalledWith(1, "/api/news/sources", {
    timeout: TIMEOUT_MS,
  });
  expect(get).toHaveBeenNthCalledWith(2, "/api/news/top-headlines", {
    params: { sources: "abc" },
    timeout: TIMEOUT_MS,
  });
});

test.each([
  ["an HTML page", "<!DOCTYPE html>"],
  ["no body", null],
  ["a missing list", { status: "ok" }],
  ["a list of the wrong type", { sources: "none" }],
  ["only invalid items", { sources: [{}, null] }],
])("rejects a response with %s", async (_, data) => {
  respond(data);

  await expect(fetchSources()).rejects.toThrow(UNEXPECTED_DATA);
});

test("rejects an error reported with status 200", async () => {
  respond({ status: "error", message: "Key disabled." });

  await expect(fetchSources()).rejects.toThrow("Key disabled.");
});

test("accepts an empty list", async () => {
  respond({ articles: [] });

  await expect(fetchArticles("abc")).resolves.toEqual([]);
  expect(console.warn).not.toHaveBeenCalled();
});

test.each([
  ["no id", { id: undefined }],
  ["an empty name", { name: "" }],
  ["a script URL", { url: "javascript:alert(1)" }],
  ["a relative URL", { url: "/home" }],
  ["a numeric description", { description: 5 }],
])("skips a source with %s", async (_, change) => {
  respond({ sources: [source, { ...source, id: "bad", ...change }] });

  await expect(fetchSources()).resolves.toEqual([source]);
  expect(console.warn).toHaveBeenCalledWith("Skipped 1 invalid sources");
});

test.each([
  ["no title", { title: null }],
  ["no URL", { url: null }],
  ["a bad date", { publishedAt: "yesterday" }],
])("skips an article with %s", async (_, change) => {
  const good = makeArticle();
  respond({
    articles: [good, { ...good, url: "https://example.com/bad", ...change }],
  });

  await expect(fetchArticles("abc")).resolves.toEqual([good]);
});

test("allows a missing author and description", async () => {
  const { title, url, publishedAt } = makeArticle();
  const bare = { title, url, publishedAt, author: null };
  respond({ articles: [bare] });

  await expect(fetchArticles("abc")).resolves.toEqual([bare]);
});

test("drops duplicate sources and articles", async () => {
  respond({
    sources: [source, source],
    articles: [makeArticle(), makeArticle()],
  });

  await expect(fetchSources()).resolves.toHaveLength(1);
  await expect(fetchArticles("abc")).resolves.toHaveLength(1);
});
