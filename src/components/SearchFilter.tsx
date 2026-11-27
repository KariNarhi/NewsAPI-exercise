import { useRef } from "react";

/** Props of SearchFilter. */
interface SearchFilterProps {
  query: string;
  onChange: (query: string) => void;
  // Number of sources that match the query
  matches: number;
  // Number of sources in all
  total: number;
}

/** The line under the field that describes the result of the search. */
const summary = (query: string, matches: number, total: number) => {
  const noun = total === 1 ? "source" : "sources";
  if (!query.trim()) return `${total} ${noun}`;
  if (matches === 0) return "No sources match your search.";
  return `${matches} of ${total} ${noun}`;
};

/**
 * Search field for the sources, with a Clear button and a result count.
 *
 * A controlled component: App holds the query and does the filtering.
 */
const SearchFilter = ({
  query,
  onChange,
  matches,
  total,
}: SearchFilterProps) => {
  const input = useRef<HTMLInputElement>(null);

  /** Empties the search and puts the cursor back, as the button disappears. */
  const clear = () => {
    onChange("");
    input.current?.focus();
  };

  return (
    <search className="d-block mb-3">
      <div className="app-search d-flex gap-2">
        <input
          ref={input}
          type="search"
          dir="auto"
          className="form-control app-input"
          aria-label="Search sources"
          placeholder="Search by name or description"
          value={query}
          onChange={(event) => onChange(event.target.value)}
        />
        {query && (
          <button type="button" className="btn btn-clear" onClick={clear}>
            Clear
          </button>
        )}
      </div>
      {/* role="status" makes screen readers announce the new count */}
      <p className="app-search-summary mt-2 mb-0" role="status">
        {summary(query, matches, total)}
      </p>
    </search>
  );
};

export default SearchFilter;
