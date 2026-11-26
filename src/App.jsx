import { useState, useEffect } from "react";
import Sources from "./components/Sources";
import Pagination from "./components/Pagination";
import Headlines from "./components/Headlines";
import getErrorMessage from "./getErrorMessage";
import axios from "axios";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router";

const App = () => {
  // Initialize states
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourcesPerPage] = useState(10);

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

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Router>
      <div className="container-fluid bg-dark mb-0">
        <div className="container pt-3 pb-5">
          <h1 className="text-primary mb-3">News from News API</h1>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      Could not load sources: {error}
                    </div>
                  )}
                  <Sources sources={currentSources} loading={loading} />
                  <Pagination
                    sourcesPerPage={sourcesPerPage}
                    totalSources={sources.length}
                    paginate={paginate}
                  />
                </>
              }
            />
            <Route
              path="/headlines"
              element={
                <>
                  <h3>
                    <Link to="/" className="badge badge-info">
                      Back to sources
                    </Link>
                  </h3>
                  <Headlines loading={loading} />
                </>
              }
            />
          </Routes>

          <h3 className="mb-0">
            <a
              href="https://newsapi.org/"
              className="badge badge-info"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by News API
            </a>
          </h3>
        </div>
      </div>
    </Router>
  );
};

export default App;
