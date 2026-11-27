import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import ErrorAlert from "./ErrorAlert";
import { fetchArticles } from "../api";
import getErrorMessage from "../getErrorMessage";
import type { Article } from "../types";

interface Result {
  source: string | null;
  articles: Article[];
}

interface SourceError {
  source: string | null;
  message: string;
  retrying?: boolean;
}

const Headlines = () => {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<SourceError | null>(null);
  const [searchParams] = useSearchParams();
  const [attempt, setAttempt] = useState(0); // Increased to retry

  // Get source.id (passed in Sources.tsx component) parameter from URL
  const source = searchParams.get("source");

  useEffect(() => {
    let ignore = false; // Drop responses that arrive after the source changed

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

  const formatTime = (publishedAt: string) => {
    const publishDate = publishedAt.slice(0, 10);
    return publishDate;
  };

  if (error?.source === source) {
    if (error.retrying) return <h2 className="app-loading">Loading...</h2>;

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

  // Loading until there is a result for this source, which also keeps the
  // previous source's articles from showing
  if (result?.source !== source) {
    return <h2 className="app-loading">Loading...</h2>;
  }

  if (result.articles.length === 0) {
    return (
      <p className="app-empty" role="status">
        No headlines
      </p>
    );
  }

  /* Map through the headlines and return them as a card grid */
  return (
    <ul className="row row-cols-1 row-cols-md-2 g-3 list-unstyled mb-4">
      {result.articles.map((article) => (
        <li key={article.url} className="col">
          <article className="app-card">
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
