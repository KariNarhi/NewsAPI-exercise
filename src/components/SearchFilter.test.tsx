/** Tests of the search field on its own; filtering is tested elsewhere. */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import SearchFilter from "./SearchFilter";

/** Renders the field and returns its onChange spy. */
const renderSearch = (query = "", matches = 5, total = 5) => {
  const onChange = vi.fn();
  render(
    <SearchFilter
      query={query}
      onChange={onChange}
      matches={matches}
      total={total}
    />,
  );
  return onChange;
};

/** The search field. */
const input = () =>
  screen.getByRole("searchbox", { name: "Search sources" });

test.each([
  ["", 5, 5, "5 sources"],
  ["", 1, 1, "1 source"],
  ["abc", 2, 5, "2 of 5 sources"],
  ["abc", 0, 5, "No sources match your search."],
])("for %j summarises %i of %i", (query, matches, total, expected) => {
  renderSearch(query, matches, total);

  expect(screen.getByRole("status")).toHaveTextContent(expected);
});

test("reports what is typed", async () => {
  const onChange = renderSearch();

  await userEvent.type(input(), "x");

  expect(onChange).toHaveBeenCalledExactlyOnceWith("x");
});

test("clears the search and keeps focus in the field", async () => {
  const onChange = renderSearch("abc");

  await userEvent.click(screen.getByRole("button", { name: "Clear" }));

  expect(onChange).toHaveBeenCalledExactlyOnceWith("");
  expect(input()).toHaveFocus();
});

test("has no Clear button without a search", () => {
  renderSearch();

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
