/** Tests of how many page buttons show, which ones, and what they do. */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import Pagination from "./Pagination";

/** Accessible names of the arrow buttons. */
const ARROWS = ["First page", "Previous page", "Next page", "Last page"];

afterEach(() => vi.unstubAllGlobals());

/**
 * jsdom has no layout, so this fakes ResizeObserver to report a chosen width.
 *
 * @returns `resize` to report a new width later.
 */
const stubWidth = (initial: number) => {
  let notify: (entries: { contentRect: { width: number } }[]) => void;
  const report = (width: number) => notify([{ contentRect: { width } }]);

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: typeof notify) {
        notify = callback;
      }
      observe() {
        report(initial);
      }
      disconnect() {}
    },
  );

  return { resize: (width: number) => act(() => report(width)) };
};

/** Renders Pagination with 12 items per page. */
const renderPagination = ({
  pages = 20,
  currentPage = 1,
  paginate = vi.fn(),
} = {}) =>
  render(
    <Pagination
      sourcesPerPage={12}
      totalSources={pages * 12}
      currentPage={currentPage}
      paginate={paginate}
    />,
  );

/** The page numbers currently shown; arrow symbols are filtered out. */
const numbers = () =>
  screen
    .queryAllByRole("button")
    .map((button) => Number(button.textContent))
    .filter(Boolean);

/** An arrow button by its accessible name. */
const arrow = (name: string) =>
  screen.getByRole<HTMLButtonElement>("button", { name });

test.each([
  // [width of the nav, how many page numbers fit]
  [296, 2], // 320 px screen
  [366, 3], // 390 px screen
  [696, 10],
  [1116, 18],
  [100, 1], // never fewer than one
])("shows what fits in a width of %i px", (width, count) => {
  stubWidth(width);

  renderPagination({ pages: 50 });

  expect(numbers()).toHaveLength(count);
});

test.each([
  [1, [1, 2, 3]],
  [2, [1, 2, 3]],
  [10, [9, 10, 11]],
  [19, [18, 19, 20]],
  [20, [18, 19, 20]],
])("on page %i shows the numbers %j", (currentPage, expected) => {
  stubWidth(366);

  renderPagination({ currentPage });

  expect(numbers()).toEqual(expected);
  expect(screen.getByRole("button", { current: "page" })).toHaveTextContent(
    String(currentPage),
  );
});

test.each([
  ["First page", 1],
  ["Previous page", 9],
  ["Next page", 11],
  ["Last page", 20],
])("the %s button goes to page %i", async (name, page) => {
  const paginate = vi.fn();
  renderPagination({ currentPage: 10, paginate });

  await userEvent.click(arrow(name));

  expect(paginate).toHaveBeenCalledExactlyOnceWith(page);
});

test("passes the clicked page number to paginate", async () => {
  const paginate = vi.fn();
  renderPagination({ pages: 3, paginate });

  await userEvent.click(screen.getByRole("button", { name: "3" }));

  expect(paginate).toHaveBeenCalledExactlyOnceWith(3);
});

test.each([
  [1, ["First page", "Previous page"]],
  [2, []],
  [3, ["Next page", "Last page"]],
])("on page %i of 3 disables %j", (currentPage, disabled) => {
  renderPagination({ pages: 3, currentPage });

  const found = ARROWS.filter((name) => arrow(name).disabled);
  expect(found).toEqual(disabled);
});

test.each([
  [0, []],
  [1, [1]],
])("has no arrow buttons with %i pages", (pages, expected) => {
  renderPagination({ pages });

  expect(numbers()).toEqual(expected);
  expect(screen.queryAllByRole("button")).toHaveLength(expected.length);
});

test("keeps the arrow buttons when every number fits", () => {
  stubWidth(1116);

  renderPagination({ pages: 3 });

  expect(numbers()).toEqual([1, 2, 3]);
  ARROWS.forEach((name) => expect(arrow(name)).toBeInTheDocument());
});

test("updates when the width changes", () => {
  const { resize } = stubWidth(296);
  renderPagination();
  expect(numbers()).toHaveLength(2);

  resize(696);

  expect(numbers()).toHaveLength(10);
});

test("shows every number when the width cannot be measured", () => {
  renderPagination({ pages: 25 });

  expect(numbers()).toHaveLength(25);
});
