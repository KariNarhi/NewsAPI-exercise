import { useLayoutEffect, useRef, useState } from "react";

/** Button width in px. Must match .app-pagination in App.css. */
const BUTTON_WIDTH = 44;
/** Space between buttons in px. Must match .app-pagination in App.css. */
const GAP = 6;
/** First, previous, next and last. */
const ARROW_COUNT = 4;

/**
 * Tracks the width of an element as it is resized.
 *
 * @returns A ref to attach to the element, and its width in px. The width is 0
 * where it cannot be measured, as in jsdom without ResizeObserver.
 */
const useWidth = () => {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!window.ResizeObserver) return;

    // Reports the size once on observe() and then on every change
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current!); // Set before layout effects run
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};

/** Props of Pagination. */
interface PaginationProps {
  sourcesPerPage: number;
  // Number of items to page through, after any search
  totalSources: number;
  // Counted from 1
  currentPage: number;
  paginate: (pageNumber: number) => void;
}

/**
 * One row of page buttons: first, previous, as many page numbers as fit, next
 * and last. It holds no page state; clicks are reported through `paginate`.
 */
const Pagination = ({
  sourcesPerPage,
  totalSources,
  currentPage,
  paginate,
}: PaginationProps) => {
  const [ref, width] = useWidth();
  const totalPages = Math.ceil(totalSources / sourcesPerPage);

  // n buttons need n widths and n - 1 gaps, hence the extra GAP in the sum.
  // Without a measured width, every number is shown
  const slots = Math.floor((width + GAP) / (BUTTON_WIDTH + GAP));
  const fitting = width ? Math.max(1, slots - ARROW_COUNT) : totalPages;
  const visible = Math.min(fitting, totalPages);

  // The numbers form a window: keep the current page in the middle of it,
  // without running past either end
  const first = Math.max(
    1,
    Math.min(currentPage - Math.floor(visible / 2), totalPages - visible + 1),
  );
  const pageNumbers = Array.from({ length: visible }, (_, i) => first + i);

  /**
   * An arrow button leading to `page`. Disabled when that page does not exist
   * or is the one already shown.
   */
  const arrow = (symbol: string, label: string, page: number) => {
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
    // The nav is measured, as its width does not depend on the buttons
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
