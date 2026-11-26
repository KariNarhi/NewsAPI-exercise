import { useLayoutEffect, useRef, useState } from "react";

// Must match the button width and gap of .app-pagination in App.css
const BUTTON_WIDTH = 44;
const GAP = 6;
const ARROW_COUNT = 4;

// Width of the referenced element, or 0 where it cannot be measured
const useWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!window.ResizeObserver) return;

    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};

const Pagination = ({ sourcesPerPage, totalSources, currentPage, paginate }) => {
  const [ref, width] = useWidth();
  const totalPages = Math.ceil(totalSources / sourcesPerPage);

  // How many page numbers fit on one row between the arrow buttons
  const slots = Math.floor((width + GAP) / (BUTTON_WIDTH + GAP));
  const fitting = width ? Math.max(1, slots - ARROW_COUNT) : totalPages;
  const visible = Math.min(fitting, totalPages);

  // Keep the current page in the middle, without running past either end
  const first = Math.max(
    1,
    Math.min(currentPage - Math.floor(visible / 2), totalPages - visible + 1),
  );
  const pageNumbers = Array.from({ length: visible }, (_, i) => first + i);

  const arrow = (symbol, label, page) => {
    const disabled = page < 1 || page > totalPages || page === currentPage;

    return (
      <li className={`page-item${disabled ? " disabled" : ""}`}>
        <button
          type="button"
          onClick={() => paginate(page)}
          disabled={disabled}
          aria-label={label}
          className="page-link"
        >
          {symbol}
        </button>
      </li>
    );
  };

  return (
    <nav ref={ref} aria-label="Pagination">
      <ul className="pagination app-pagination justify-content-center">
        {totalPages > 1 && (
          <>
            {arrow("«", "First page", 1)}
            {arrow("‹", "Previous page", currentPage - 1)}
          </>
        )}
        {pageNumbers.map((number) => (
          <li
            key={number}
            className={`page-item${number === currentPage ? " active" : ""}`}
          >
            <button
              type="button"
              onClick={() => paginate(number)}
              aria-current={number === currentPage ? "page" : undefined}
              className="page-link"
            >
              {number}
            </button>
          </li>
        ))}
        {totalPages > 1 && (
          <>
            {arrow("›", "Next page", currentPage + 1)}
            {arrow("»", "Last page", totalPages)}
          </>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
