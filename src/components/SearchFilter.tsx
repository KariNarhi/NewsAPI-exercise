import { useRef } from "react";

interface SearchFilterProps {
  query: string;
  onChange: (query: string) => void;
  matches: number;
  total: number;
}

const summary = (query: string, matches: number, total: number) => {
  const noun = total === 1 ? "source" : "sources";
  if (!query.trim()) return `${total} ${noun}`;
  if (matches === 0) return "No sources match your search.";
  return `${matches} of ${total} ${noun}`;
};

const SearchFilter = ({
  query,
  onChange,
  matches,
  total,
}: SearchFilterProps) => {
  const input = useRef<HTMLInputElement>(null);

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
      <p className="app-search-summary mt-2 mb-0" role="status">
        {summary(query, matches, total)}
      </p>
    </search>
  );
};

export default SearchFilter;
