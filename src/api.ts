/**
 * Access to News API. All requests of the app go through this module.
 *
 * Request path: browser -> `/api/news/*` -> Vite proxy (adds the API key, see
 * vite.config.ts) -> `https://newsapi.org/v2/*`. Responses are validated here,
 * so the rest of the app only sees well-formed data.
 */

import axios from "axios";
import type * as z from "zod/mini";
import { articleSchema, sourceSchema, type Article, type Source } from "./types";

/** How long a request may take before it fails. */
export const TIMEOUT_MS = 10_000;
/** Message for a response that cannot be used. */
export const UNEXPECTED_DATA = "The news service sent unexpected data.";

/**
 * Validates a list response and returns its usable items.
 *
 * @param data - Response body, not yet trusted.
 * @param field - Property of the body that holds the list.
 * @param schema - Zod schema that each item must match.
 * @param keyOf - Identity of an item, for removing duplicates.
 * @returns The valid, unique items. An empty list is a valid result.
 * @throws Error if the body reports an error, has no list, or has items of
 * which none are valid.
 */
const parseList = <Item>(
  data: unknown,
  field: string,
  schema: z.ZodMiniType<Item>,
  keyOf: (item: Item) => string,
): Item[] => {
  // The body may be anything, e.g. an HTML page from a misconfigured host
  const body = (data ?? {}) as Record<string, unknown>;
  // News API can describe an error in the body
  if (body.status === "error") {
    throw new Error(
      typeof body.message === "string" ? body.message : UNEXPECTED_DATA,
    );
  }

  const list = body[field];
  if (!Array.isArray(list)) throw new Error(UNEXPECTED_DATA);

  // Keep the items that match the schema, drop the rest
  const valid = list.flatMap((item) => {
    const result = schema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  if (list.length > 0 && valid.length === 0) throw new Error(UNEXPECTED_DATA);
  if (valid.length < list.length) {
    console.warn(`Skipped ${list.length - valid.length} invalid ${field}`);
  }

  // A Map keeps one item per key. Duplicates would collide as React keys
  return [...new Map(valid.map((item) => [keyOf(item), item])).values()];
};

/**
 * Loads all news sources.
 *
 * @throws The axios error of a failed request, or Error for unusable data.
 * Turn either into text with `getErrorMessage`.
 */
export const fetchSources = async (): Promise<Source[]> => {
  const res = await axios.get("/api/news/sources", { timeout: TIMEOUT_MS });
  return parseList(res.data, "sources", sourceSchema, (source) => source.id);
};

/**
 * Loads the top headlines of one source.
 *
 * @param source - Source id. With null, axios leaves the parameter out and
 * News API answers with an error.
 * @throws Same as `fetchSources`.
 */
export const fetchArticles = async (
  source: string | null,
): Promise<Article[]> => {
  const res = await axios.get("/api/news/top-headlines", {
    params: { sources: source },
    timeout: TIMEOUT_MS,
  });
  return parseList(
    res.data,
    "articles",
    articleSchema,
    (article) => article.url,
  );
};
