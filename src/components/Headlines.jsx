import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import getErrorMessage from "../getErrorMessage";

const Headlines = ({ loading }) => {
  const [articles, setArticles] = useState([]);
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
          setArticles(res.data.articles); // Add news to "articles" state
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
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  const formatTime = (publishedAt) => {
    const publishDate = publishedAt.slice(0, 10);
    return publishDate;
  };

  if (error?.source === source) {
    return (
      <div className="alert alert-danger" role="alert">
        Could not load headlines: {error.message}
      </div>
    );
  }

  /* Map through the headlines received as props, and return them as a list */
  return (
    <ul className="list-group mb-4">
      {articles.map((article) => (
        <li key={article.title} className="list-group-item itemhover">
          <h4>
            <b>{article.title}</b>
          </h4>
          <p>
            <i>{article.author}</i>
          </p>
          <blockquote className="blockquote">{article.description}</blockquote>
          <h3>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="badge badge-primary"
            >
              Read More
            </a>
          </h3>
          <br />
          <b>{formatTime(article.publishedAt)}</b>
        </li>
      ))}
    </ul>
  );
};

export default Headlines;
