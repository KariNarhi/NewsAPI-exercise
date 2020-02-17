import React from "react";

const Pagination = ({ sourcesPerPage, totalSources, paginate }) => {
  const pageNumbers = []; // Empty array for pagenumbers.

  // Create pagenumbers from total sources divided by sources per page.
  for (let i = 1; i <= Math.ceil(totalSources / sourcesPerPage); i++) {
    pageNumbers.push(i); // Push pagenumbers to their own array.
  }

  /* Map through pagenumbers and return a link for each of them */
  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className="page-item">
            {/* eslint-disable-next-line */}
            <a onClick={() => paginate(number)} href="#" className="page-link">
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;
