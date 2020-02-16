import React from "react";

const Posts = ({ posts, loading }) => {
  if (loading) {
    return <h2>Loading...</h2>; // Show text "Loading..." if loading not done.
  }

  /* Map through the posts received as props, and return them as a list */
  return (
    <ul className="list-group mb-4">
      {posts.map(post => (
        <li key={post.id} className="list-group-item">
          <h4>{post.name}</h4>
          <p>{post.description}</p>
          <a href={post.url} target="_blank" rel="noopener noreferrer">
            {post.url}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Posts;
