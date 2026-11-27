// Shapes of the News API data that the app uses, checked at runtime by api.ts
import * as z from "zod/mini";

const text = z.string().check(z.minLength(1));
const webUrl = z.url({ protocol: /^https?$/ });
const optionalText = z.nullish(z.string());

export const sourceSchema = z.object({
  id: text,
  name: text,
  description: optionalText,
  url: webUrl,
});

export const articleSchema = z.object({
  title: text,
  author: optionalText,
  description: optionalText,
  url: webUrl,
  publishedAt: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}/)),
});

export type Source = z.infer<typeof sourceSchema>;
export type Article = z.infer<typeof articleSchema>;
