/** Tests of matching sources against a search query. */

import { expect, test } from "vitest";
import filterSources from "./filterSources";
import type { Source } from "./types";

// One source has no description; the URLs do not matter here
const sources: Source[] = [
  { id: "a", name: "Daily Sun", description: "Sport and weather", url: "u" },
  { id: "b", name: "Tech Wire", description: null, url: "u" },
  { id: "c", name: "Evening Post", description: "Technology news", url: "u" },
];

/** Ids of the matching sources. */
const ids = (query: string) =>
  filterSources(sources, query).map((source) => source.id);

test.each([
  ["", ["a", "b", "c"]],
  ["   ", ["a", "b", "c"]],
  ["daily", ["a"]],
  ["WEATHER", ["a"]],
  ["tech", ["b", "c"]],
  ["  post  ", ["c"]],
  ["nothing", []],
])("with %j matches %j", (query, expected) => {
  expect(ids(query)).toEqual(expected);
});
