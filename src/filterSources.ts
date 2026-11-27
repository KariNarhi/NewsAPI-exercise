import type { Source } from "./types";

// Sources whose name or description contains the query, ignoring case
const filterSources = (sources: Source[], query: string): Source[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return sources;

  return sources.filter(({ name, description }) =>
    [name, description].some((text) => text?.toLowerCase().includes(needle)),
  );
};

export default filterSources;
