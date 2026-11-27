import axios from "axios";
import type * as z from "zod/mini";
import { articleSchema, sourceSchema, type Article, type Source } from "./types";

export const TIMEOUT_MS = 10_000;
export const UNEXPECTED_DATA = "The news service sent unexpected data.";

// Returns the valid, unique items of data[field]. Throws if the response as a
// whole is unusable.
const parseList = <Item>(
  data: unknown,
  field: string,
  schema: z.ZodMiniType<Item>,
  keyOf: (item: Item) => string,
): Item[] => {
  const body = (data ?? {}) as Record<string, unknown>;
  if (body.status === "error") {
    throw new Error(
      typeof body.message === "string" ? body.message : UNEXPECTED_DATA,
    );
  }

  const list = body[field];
  if (!Array.isArray(list)) throw new Error(UNEXPECTED_DATA);

  const valid = list.flatMap((item) => {
    const result = schema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  if (list.length > 0 && valid.length === 0) throw new Error(UNEXPECTED_DATA);
  if (valid.length < list.length) {
    console.warn(`Skipped ${list.length - valid.length} invalid ${field}`);
  }

  // Duplicates would collide as React keys
  return [...new Map(valid.map((item) => [keyOf(item), item])).values()];
};

export const fetchSources = async (): Promise<Source[]> => {
  const res = await axios.get("/api/news/sources", { timeout: TIMEOUT_MS });
  return parseList(res.data, "sources", sourceSchema, (source) => source.id);
};

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
