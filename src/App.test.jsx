import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import { makeArticle, makeSources } from "./testFixtures";

vi.mock("axios");

const mockApi = () =>
  axios.get.mockImplementation(async (url) => ({
    data: url.endsWith("/sources")
      ? { sources: makeSources(13) }
      : { articles: [makeArticle()] },
  }));

const sourceRequests = () =>
  axios.get.mock.calls.filter(([url]) => url === "/api/news/sources");

const click = (name) => userEvent.click(screen.getByRole("link", { name }));

const goToPage = (name) =>
  userEvent.click(screen.getByRole("button", { name }));

const pageButton = (name) => screen.getByRole("button", { name });

beforeEach(() => {
  window.history.pushState({}, "", "/");
  // jsdom does not implement scrolling
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
  });
});

test("shows an error when sources fail to load", async () => {
  axios.get.mockRejectedValue({
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
  axios.get.mockImplementation(async (url) => {
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
