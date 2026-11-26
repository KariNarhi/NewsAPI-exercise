import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import getErrorMessage from "../getErrorMessage";

const Headlines = ({ loading }) => {
  const [result, setResult] = useState({ source: null, articles: [] });
  const [error, setError] = useState(null); // { source, message }
  const [searchParams] = useSearchParams();

  // Get source.id (passed in Sources.jsx component) parameter from URL
  const source = searchParams.get("source");

  useEffect(() => {
    let ignore = false; // Drop responses that arrive after the source changed

    const fetchArticles = async () => {
      try {
        const res = await axios.get("/api/news/top-headlines", {
          params: { sources: source },
        });
        if (!ignore) {
          setResult({ source, articles: res.data.articles });
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError({ source, message: getErrorMessage(err) });
      }
    };

    fetchArticles();

    return () => {
      ignore = true;
    };
  }, [source]);

  if (loading) {
    return <h2 className="app-loading">Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  const formatTime = (publishedAt) => {
    const publishDate = publishedAt.slice(0, 10);
    return publishDate;
  };

  if (error?.source === source) {
    return (
      <div className="alert app-alert" role="alert">
        Could not load headlines: {error.message}
      </div>
    );
  }

  // Never show the previous source's articles while the next ones load
  const articles = result.source === source ? result.articles : [];

  /* Map through the headlines received as props, and return them as a card grid */
  return (
    <ul className="row row-cols-1 row-cols-md-2 g-3 list-unstyled mb-4">
      {articles.map((article) => (
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
