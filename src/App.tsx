import { useState, useEffect } from "react";
import Sources from "./components/Sources";
import Pagination from "./components/Pagination";
import Headlines from "./components/Headlines";
import getErrorMessage from "./getErrorMessage";
import ErrorAlert from "./components/ErrorAlert";
import SearchFilter from "./components/SearchFilter";
import filterSources from "./filterSources";
import { fetchSources } from "./api";
import type { Source } from "./types";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router";

const App = () => {
  // Initialize states
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // Increased to retry
  const [query, setQuery] = useState("");
  const [sourcesPerPage] = useState(12); // Fills rows of 1, 2 or 3 cards

  useEffect(() => {
    let ignore = false;

    // Get news sources from News API
    const fetchNews = async () => {
      setLoading(true);
      try {
        const loaded = await fetchSources();
        if (ignore) return;
        setSources(loaded); // Add news sources to "sources" state
        setError(null);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      }
      if (!ignore) setLoading(false);
    };

    fetchNews();

    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setError(null);
    setAttempt((count) => count + 1);
  };

  const indexOfLastSource = currentPage * sourcesPerPage; // Get last source index
  const indexOfFirstSource = indexOfLastSource - sourcesPerPage; // Get first source index
  const matchingSources = filterSources(sources, query);
  const currentSources = matchingSources.slice(
    indexOfFirstSource,
    indexOfLastSource,
  ); // Get current sources

  // A new search starts from the first page
  const search = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  // Change page and go back to the top of the list
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <Router>
      <nav className="navbar app-nav">
        <div className="container">
          <Link to="/" className="navbar-brand">
            News from News API
          </Link>
        </div>
      </nav>

      <main className="container app-main py-4">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <h1 className="app-title">Sources</h1>
                {error && (
                  <ErrorAlert onRetry={retry}>
                    Could not load sources: {error}
                  </ErrorAlert>
                )}
                {!loading && sources.length > 0 && (
                  <SearchFilter
                    query={query}
                    onChange={search}
                    matches={matchingSources.length}
                    total={sources.length}
                  />
                )}
                <Sources sources={currentSources} loading={loading} />
                <Pagination
                  sourcesPerPage={sourcesPerPage}
                  totalSources={matchingSources.length}
                  currentPage={currentPage}
                  paginate={paginate}
                />
              </>
            }
          />
          <Route
            path="/headlines"
            element={
              <>
                <Link to="/" className="btn btn-clear mb-3">
                  Back to sources
                </Link>
                <h1 className="app-title">Top headlines</h1>
                <Headlines />
              </>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <a href="https://newsapi.org/" target="_blank" rel="noopener noreferrer">
          Powered by News API
        </a>
      </footer>
    </Router>
  );
};

export default App;
