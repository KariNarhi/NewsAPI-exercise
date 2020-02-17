import React from "react";

const Headlines = ({ headlines, loading }) => {
  if (loading) {
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  /* Map through the headlines received as props, and return them as a list */

  return (
    <ul className="list-group mb-4">
      {headlines.map(headline => (
        <li key={headline.id} className="list-group-item itemhover">
          <h4>{headline.title}</h4>
          <p>{headline.description}</p>
          <a href={headline.url} target="_blank" rel="noopener noreferrer">
            {headline.url}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Headlines;
