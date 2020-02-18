import React, { useState, useEffect } from "react";
import Sources from "./components/Sources";
import Pagination from "./components/Pagination";
import Headlines from "./components/Headlines";
import axios from "axios";
import { Key } from "./API_Key"; // Import API key from outside the code.
import "./App.css";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";

const App = () => {
  // Initialize states
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourcesPerPage] = useState(10);

  useEffect(() => {
    // Get news sources from News API
    const fetchNews = async () => {
      setLoading(true);
      const res = await axios.get(
        `http://newsapi.org/v2/sources?apiKey=${Key}`
      );
      setSources(res.data.sources); // Add news sources to "sources" state
      setLoading(false);
    };

    fetchNews();
  }, []);

  const indexOfLastSource = currentPage * sourcesPerPage; // Get last source index
  const indexOfFirstSource = indexOfLastSource - sourcesPerPage; // Get first source index
  const currentSources = sources.slice(indexOfFirstSource, indexOfLastSource); // Get current sources

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber);

  return (
    <Router>
      <div className="container-fluid bg-dark mb-0">
        <div className="container pt-3 pb-5">
          <h1 className="text-primary mb-3">News from News API</h1>
          <Switch>
            <Route
              exact
              path="/"
              render={props => (
                <React.Fragment>
                  <Sources sources={currentSources} loading={loading} />
                  <Pagination
                    sourcesPerPage={sourcesPerPage}
                    totalSources={sources.length}
                    paginate={paginate}
                  />
                </React.Fragment>
              )}
            />
            <Route
              path="/headlines"
              render={props => (
                <React.Fragment>
                  <h3>
                    <Link to="/" className="badge badge-info">
                      Back to sources
                    </Link>
                  </h3>
                  <Headlines loading={loading} />
                </React.Fragment>
              )}
            />
          </Switch>

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
