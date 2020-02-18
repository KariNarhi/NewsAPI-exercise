import React from "react";
import { Link } from "react-router-dom";

const Sources = ({ sources, loading }) => {
  if (loading) {
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  /* Map through the sources received as props, and return them as a list */
  return (
    <ul className="list-group mb-4">
      {sources.map(source => (
        <li key={source.id} className="list-group-item itemhover">
          <h4>{source.name}</h4>
          <p>{source.description}</p>
          <Link
            to={{
              pathname: `/headlines/?source=${source.id}`,
              source: { sourceID: source.id }
            }}
            className="btn btn-success mr-5"
          >
            Top headlines
          </Link>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.url}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Sources;
