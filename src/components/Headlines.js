import React, { useState } from "react";
import axios from "axios";
import { Key } from "../API_Key"; // Import API key from outside the code.

const Headlines = ({ loading }) => {
  const [articles, setArticles] = useState([]);

  if (loading) {
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  // Get source.id (passed in Sources.js component) parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get("source");

  // console.log(source);

  const fetchArticles = async () => {
    const res = await axios.get(
      `http://newsapi.org/v2/top-headlines?sources=${source}&apiKey=${Key}`
    );
    setArticles(res.data.articles); // Add news to "articles" state
    // console.log(res.data.articles);
  };

  if (articles.length === 0) {
    fetchArticles();
  }

  /* Map through the headlines received as props, and return them as a list */
  return (
    <ul className="list-group mb-4">
      {articles.map(article => (
        <li key={article.title} className="list-group-item itemhover">
          <h4>{article.title}</h4>
          <p>
            <i>{article.author}</i>
          </p>
          <blockquote>{article.description}</blockquote>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.url}
          </a>
          <br />
          <br />
          <b>{article.publishedAt}</b>
        </li>
      ))}
    </ul>
  );
};

export default Headlines;
