import React, { useState, useEffect } from "react";
import Posts from "./components/Posts";
import Pagination from "./components/Pagination";
import axios from "axios";
import { Key } from "./API_Key"; // Import API key from outside the code.
import "./App.css";

const App = () => {
  // Initialize states
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  useEffect(() => {
    // Get news from News API
    const fetchPosts = async () => {
      setLoading(true);
      const res = await axios.get(
        `http://newsapi.org/v2/sources?apiKey=${Key}`
      );
      setPosts(res.data.sources); // Add news sources to "posts" state
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const indexOfLastPost = currentPage * postsPerPage; // Get last post index
  const indexOfFirstPost = indexOfLastPost - postsPerPage; // Get first post index
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost); // Get current posts

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber);

  return (
    <div className="container-fluid bg-dark mb-0">
      <div className="container pt-3 pb-5">
        <h1 className="text-primary mb-3">News from News API</h1>
        <Posts posts={currentPosts} loading={loading} />
        <Pagination
          postsPerPage={postsPerPage}
          totalPosts={posts.length}
          paginate={paginate}
        />
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
  );
};

export default App;
