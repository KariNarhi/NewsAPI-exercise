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
          {post.name}
        </li>
      ))}
    </ul>
  );
};

export default Posts;
