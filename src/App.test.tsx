/**
 * Integration tests: the whole app in jsdom, with only axios mocked. Covers the
 * path from a request through validation and state to what is shown.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, expect, test, vi, type Mock } from "vitest";
import App from "./App";
import { makeArticle, makeSources } from "./testFixtures";

// No real requests. `mockReset` in vite.config.ts clears it between tests
vi.mock("axios");
const get = axios.get as Mock;

/** Answers like News API: 13 sources (two pages) or one article. */
const mockApi = () =>
  get.mockImplementation(async (url: string) => ({
    data: url.endsWith("/sources")
      ? { sources: makeSources(13) }
      : { articles: [makeArticle()] },
  }));

/** Calls made to the sources endpoint. */
const sourceRequests = () =>
  get.mock.calls.filter(([url]) => url === "/api/news/sources");

/** Clicks a link. */
const click = (name: string) => userEvent.click(screen.getByRole("link", { name }));

/** Clicks a pagination button. */
const goToPage = (name: string) =>
  userEvent.click(screen.getByRole("button", { name }));

const pageButton = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  // The URL outlives a test, so start each one from the front page
  window.history.pushState({}, "", "/");
  // jsdom does not implement scrolling; the spy also lets tests check calls
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  mockApi();
});

test("shows loading, then twelve sources per page", async () => {
  render(<App />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();

  expect(await screen.findByText("Source 1")).toBeInTheDocument();
  expect(screen.getByText("Source 12")).toBeInTheDocument();
  expect(screen.queryByText("Source 13")).not.toBeInTheDocument();

  await goToPage("2");
  expect(screen.getByText("Source 13")).toBeInTheDocument();
  expect(screen.queryByText("Source 1")).not.toBeInTheDocument();
  expect(pageButton("2")).toHaveAttribute("aria-current", "page");
  expect(pageButton("1")).not.toHaveAttribute("aria-current");

  await goToPage("1");
  expect(screen.getByText("Source 1")).toBeInTheDocument();
  expect(screen.queryByText("Source 13")).not.toBeInTheDocument();
});

test("opens headlines and returns to the same page of sources", async () => {
  render(<App />);
  await screen.findByText("Source 1");
  await goToPage("2");

  await click("Top headlines");
  expect(await screen.findByText("A headline")).toBeInTheDocument();
  expect(window.location.search).toBe("?source=source-13");
  expect(axios.get).toHaveBeenCalledWith("/api/news/top-headlines", {
    params: { sources: "source-13" },
    timeout: 10_000,
  });

  await click("Back to sources");
  expect(screen.getByText("Source 13")).toBeInTheDocument();
  expect(sourceRequests()).toHaveLength(1);
});

test("loads headlines when their URL is opened directly", async () => {
  window.history.pushState({}, "", "/headlines?source=source-3");

  render(<App />);

  expect(await screen.findByText("A headline")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/news/top-headlines", {
    params: { sources: "source-3" },
    timeout: 10_000,
  });
});

test("shows an error when sources fail to load", async () => {
  get.mockRejectedValue({
    response: { data: { message: "Your API key is invalid." } },
  });

  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load sources: Your API key is invalid.",
  );
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});

test("still shows headlines when only the sources request fails", async () => {
  get.mockImplementation(async (url: string) => {
    if (url.endsWith("/sources")) throw new Error("Network Error");
    return { data: { articles: [makeArticle()] } };
  });
  window.history.pushState({}, "", "/headlines?source=source-1");

  render(<App />);

  expect(await screen.findByText("A headline")).toBeInTheDocument();
});

test("scrolls to the top only when the page is changed", async () => {
  render(<App />);
  await screen.findByText("Source 1");
  expect(window.scrollTo).not.toHaveBeenCalled();

  await goToPage("2");

  expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 0);
});

test("moves between pages with the next and previous buttons", async () => {
  render(<App />);
  await screen.findByText("Source 1");

  await goToPage("Next page");
  expect(screen.getByText("Source 13")).toBeInTheDocument();

  await goToPage("Previous page");
  expect(screen.getByText("Source 1")).toBeInTheDocument();
});

test("loads the sources again with the Try again button", async () => {
  get.mockRejectedValueOnce(new Error("Network Error"));
  render(<App />);

  await userEvent.click(
    await screen.findByRole("button", { name: "Try again" }),
  );

  expect(await screen.findByText("Source 1")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(sourceRequests()).toHaveLength(2);
});

const searchbox = () =>
  screen.getByRole("searchbox", { name: "Search sources" });

test("filters the sources and their pagination from page 1", async () => {
  render(<App />);
  await screen.findByText("Source 1");
  await goToPage("2");

  await userEvent.type(searchbox(), "source 1");

  // Source 1 and 10 to 13 match
  expect(screen.getByRole("status")).toHaveTextContent("5 of 13 sources");
  expect(screen.getAllByRole("article")).toHaveLength(5);
  expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  expect(pageButton("1")).toHaveAttribute("aria-current", "page");

  await userEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getAllByRole("article")).toHaveLength(12);
  expect(pageButton("2")).toBeInTheDocument();
  expect(sourceRequests()).toHaveLength(1);
});

test("searches descriptions and says when nothing matches", async () => {
  render(<App />);
  await screen.findByText("Source 1");

  await userEvent.type(searchbox(), "description 13");
  expect(screen.getAllByRole("article")).toHaveLength(1);

  await userEvent.type(searchbox(), "zzz");
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "No sources match your search.",
  );
});

test("keeps the search after visiting headlines", async () => {
  render(<App />);
  await screen.findByText("Source 1");
  await userEvent.type(searchbox(), "source 13");

  await click("Top headlines");
  await screen.findByText("A headline");
  await click("Back to sources");

  expect(searchbox()).toHaveValue("source 13");
  expect(screen.getAllByRole("article")).toHaveLength(1);
});

test("has no search field when the sources fail to load", async () => {
  get.mockRejectedValue(new Error("Network Error"));

  render(<App />);
  await screen.findByRole("alert");

  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});

test("shows loading while the headlines of a chosen source load", async () => {
  get.mockImplementation((url: string) =>
    url.endsWith("/sources")
      ? Promise.resolve({ data: { sources: makeSources(13) } })
      : new Promise(() => {}),
  );
  render(<App />);
  await screen.findByText("Source 1");

  const [link] = screen.getAllByRole("link", { name: "Top headlines" });
  await userEvent.click(link);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
