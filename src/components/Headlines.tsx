import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import ErrorAlert from "./ErrorAlert";
import { fetchArticles } from "../api";
import getErrorMessage from "../getErrorMessage";
import type { Article } from "../types";

/** Loaded articles, tagged with the source they belong to. */
interface Result {
  source: string | null;
  articles: Article[];
}

/** A failed request, tagged with its source. */
interface SourceError {
  source: string | null;
  message: string;
  // True while the retry is on its way
  retrying?: boolean;
}

/**
 * Top headlines of the source in the `?source=<id>` URL parameter.
 *
 * The component renders one of four states for that source: error, loading,
 * empty or a list of articles. Because `result` and `error` remember their
 * source, data of a previously viewed source is never shown as current.
 */
const Headlines = () => {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<SourceError | null>(null);
  const [searchParams] = useSearchParams();
  const [attempt, setAttempt] = useState(0); // Increased to retry

  // Set by the "Top headlines" link in Sources.tsx
  const source = searchParams.get("source");

  // Fetch when the source changes or a retry is requested
  useEffect(() => {
    // Set by the cleanup: drop a response that arrives after the source changed
    let ignore = false;

    const load = async () => {
      try {
        const articles = await fetchArticles(source);
        if (!ignore) {
          setResult({ source, articles });
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError({ source, message: getErrorMessage(err) });
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [source, attempt]);

  /** Cuts an ISO timestamp down to its date, YYYY-MM-DD. */
  const formatTime = (publishedAt: string) => {
    const publishDate = publishedAt.slice(0, 10);
    return publishDate;
  };

  // Error state. Checked first, as a failed source has no result
  if (error?.source === source) {
    if (error.retrying) return <h2 className="app-loading">Loading...</h2>;

    /** Shows "Loading..." and makes the effect run again. */
    const retry = () => {
      setError({ ...error, retrying: true });
      setAttempt((count) => count + 1);
    };

    return (
      <ErrorAlert onRetry={retry}>
        Could not load headlines: {error.message}
      </ErrorAlert>
    );
  }

  // Loading state: no result yet, or only that of the previous source
  if (result?.source !== source) {
    return <h2 className="app-loading">Loading...</h2>;
  }

  // Empty state: the request succeeded but had no articles
  if (result.articles.length === 0) {
    return (
      <p className="app-empty" role="status">
        No headlines
      </p>
    );
  }

  // One card per article: one column on phones, two from tablets up
  return (
    <ul className="row row-cols-1 row-cols-md-2 g-3 list-unstyled mb-4">
      {result.articles.map((article) => (
        <li key={article.url} className="col">
          <article className="app-card">
            {/* dir="auto" lays out right-to-left languages correctly */}
            <h2 className="app-card-title" dir="auto">
              {article.title}
            </h2>
            <p className="app-card-meta">
              {article.author && <span dir="auto">{article.author}</span>}
              <time dateTime={article.publishedAt}>
                {formatTime(article.publishedAt)}
              </time>
            </p>
            <p dir="auto">{article.description}</p>
            <div className="mt-auto">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-suggest"
              >
                Read More
              </a>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default Headlines;
