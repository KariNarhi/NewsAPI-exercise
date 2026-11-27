import type { Source } from "./types";

/**
 * Finds the sources whose name or description contains the query. Case and
 * surrounding spaces are ignored.
 *
 * @returns The matches in their original order; every source for a blank query.
 */
const filterSources = (sources: Source[], query: string): Source[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return sources;

  return sources.filter(({ name, description }) =>
    [name, description].some((text) => text?.toLowerCase().includes(needle)),
  );
};

export default filterSources;
