import { useState, useEffect } from "react";
import Sources from "./components/Sources";
import Pagination from "./components/Pagination";
import Headlines from "./components/Headlines";
import getErrorMessage from "./getErrorMessage";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router";

const App = () => {
  // Initialize states
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourcesPerPage] = useState(12); // Fills rows of 1, 2 or 3 cards

  useEffect(() => {
    // Get news sources from News API
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/news/sources");
        setSources(res.data.sources); // Add news sources to "sources" state
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const indexOfLastSource = currentPage * sourcesPerPage; // Get last source index
  const indexOfFirstSource = indexOfLastSource - sourcesPerPage; // Get first source index
  const currentSources = sources.slice(indexOfFirstSource, indexOfLastSource); // Get current sources

  // Change page and go back to the top of the list
  const paginate = (pageNumber) => {
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
                  <div className="alert app-alert" role="alert">
                    Could not load sources: {error}
                  </div>
                )}
                <Sources sources={currentSources} loading={loading} />
                <Pagination
                  sourcesPerPage={sourcesPerPage}
                  totalSources={sources.length}
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
                <Headlines loading={loading} />
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
