import React from "react";
import { Link } from "react-router-dom";

const Posts = ({ posts, loading }) => {
  if (loading) {
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  /* Map through the posts received as props, and return them as a list */
  return (
    <ul className="list-group mb-4">
      {posts.map(post => (
        <li key={post.id} className="list-group-item itemhover">
          <h4>{post.name}</h4>
          <p>{post.description}</p>
          <Link to="/headlines" className="btn btn-success mr-5">
            Top headlines
          </Link>
          <a href={post.url} target="_blank" rel="noopener noreferrer">
            {post.url}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Posts;
