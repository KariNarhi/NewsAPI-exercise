/**
 * Shapes of the News API data that the app uses. The schemas check responses at
 * runtime (see api.ts) and the TypeScript types are inferred from them, so the
 * two cannot drift apart. Properties not listed here are stripped.
 */
import * as z from "zod/mini";

/** Required, non-empty string. */
const text = z.string().check(z.minLength(1));
/** Absolute http(s) URL. Rejects e.g. `javascript:` links. */
const webUrl = z.url({ protocol: /^https?$/ });
/** String that News API may send as null or leave out. */
const optionalText = z.nullish(z.string());

/** One news source from `/v2/sources`. */
export const sourceSchema = z.object({
  id: text,
  name: text,
  description: optionalText,
  url: webUrl,
});

/** One article from `/v2/top-headlines`. */
export const articleSchema = z.object({
  title: text,
  author: optionalText,
  description: optionalText,
  url: webUrl,
  // Only the leading date is required, since only that is shown
  publishedAt: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}/)),
});

/** A validated news source. */
export type Source = z.infer<typeof sourceSchema>;
/** A validated article. */
export type Article = z.infer<typeof articleSchema>;
