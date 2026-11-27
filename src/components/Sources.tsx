import { Link } from "react-router";
import type { Source } from "../types";

interface SourcesProps {
  sources: Source[];
  loading: boolean;
}

const Sources = ({ sources, loading }: SourcesProps) => {
  if (loading) {
    return <h2 className="app-loading">Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  /* Map through the sources received as props, and return them as a card grid */
  return (
    <ul className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 list-unstyled mb-4">
      {sources.map((source) => (
        <li key={source.id} className="col">
          <article className="app-card">
            <h2 className="app-card-title" dir="auto">
              {source.name}
            </h2>
            <p dir="auto">{source.description}</p>
            <div className="mt-auto">
              <Link
                to={{
                  pathname: "/headlines",
                  search: `?source=${source.id}`,
                }}
                className="btn btn-suggest w-100"
              >
                Top headlines
              </Link>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-card-url"
              >
                {source.url}
              </a>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default Sources;
