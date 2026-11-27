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

/**
 * Root component: owns the router and all state about the list of sources.
 *
 * Data flow:
 * 1. `fetchSources` requests `/api/news/sources`; the Vite proxy adds the API
 *    key and forwards the request to News API; the response is validated.
 * 2. The full list is kept in `sources`.
 * 3. `query` filters it, and `currentPage` slices the matches into one page.
 * 4. `Sources` renders that page and `Pagination` controls `currentPage`.
 *
 * The state lives here, above the routes, so that the search and the page
 * survive a visit to the headlines. `Headlines` fetches its own data.
 */
const App = () => {
  // Data from the sources request and its progress
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What the user is looking at
  const [currentPage, setCurrentPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // Increased to retry
  const [query, setQuery] = useState("");
  const [sourcesPerPage] = useState(12); // Fills rows of 1, 2 or 3 cards

  // Runs on mount, and again whenever retry() increases `attempt`
  useEffect(() => {
    // Set by the cleanup, so that an outdated run does not update state
    let ignore = false;

    // Request the sources and store either the list or an error message
    const fetchNews = async () => {
      setLoading(true);
      try {
        const loaded = await fetchSources();
        if (ignore) return;
        setSources(loaded);
        setError(null);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      }
      // Reached after success and failure alike
      if (!ignore) setLoading(false);
    };

    fetchNews();

    return () => {
      ignore = true;
    };
  }, [attempt]);

  /** Clears the error and re-runs the sources request. */
  const retry = () => {
    setError(null);
    setAttempt((count) => count + 1);
  };

  // Derived on every render: filter first, then cut out the current page
  const indexOfLastSource = currentPage * sourcesPerPage;
  const indexOfFirstSource = indexOfLastSource - sourcesPerPage;
  const matchingSources = filterSources(sources, query);
  const currentSources = matchingSources.slice(
    indexOfFirstSource,
    indexOfLastSource,
  );

  /** Applies a new search. The old page number may not exist in the results. */
  const search = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  /** Changes the page and scrolls back to the top of the list. */
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <Router>
      {/* Header and footer are shared by every route */}
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
            // Sources: error, search, cards and pagination
            path="/"
            element={
              <>
                <h1 className="app-title">Sources</h1>
                {error && (
                  <ErrorAlert onRetry={retry}>
                    Could not load sources: {error}
                  </ErrorAlert>
                )}
                {/* Searching only makes sense once there is something to search */}
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
                  // Pages follow the search results, not the full list
                  totalSources={matchingSources.length}
                  currentPage={currentPage}
                  paginate={paginate}
                />
              </>
            }
          />
          <Route
            // Headlines of the source named in ?source=<id>
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
