import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App";

vi.mock("axios");

const sources = Array.from({ length: 11 }, (_, i) => ({
  id: `source-${i + 1}`,
  name: `Source ${i + 1}`,
  description: "A source",
  url: `https://example.com/${i + 1}`,
}));

const article = {
  title: "A headline",
  url: "https://example.com/article",
  publishedAt: "2026-01-02T03:04:05Z",
};

beforeEach(() => {
  window.history.pushState({}, "", "/");
  axios.get.mockImplementation(async (url) => ({
    data: url.endsWith("/sources") ? { sources } : { articles: [article] },
  }));
});

test("paginates the sources", async () => {
  render(<App />);
  expect(await screen.findByText("Source 1")).toBeInTheDocument();
  expect(screen.queryByText("Source 11")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: "2" }));
  expect(screen.getByText("Source 11")).toBeInTheDocument();
});

test("shows headlines for the chosen source", async () => {
  render(<App />);
  const links = await screen.findAllByRole("link", { name: "Top headlines" });

  await userEvent.click(links[1]);
  expect(await screen.findByText("A headline")).toBeInTheDocument();
  expect(window.location.search).toBe("?source=source-2");
  expect(axios.get).toHaveBeenCalledWith("/api/news/top-headlines", {
    params: { sources: "source-2" },
  });
});

test("requests a source with no articles only once", async () => {
  axios.get.mockClear();
  axios.get.mockImplementation(async (url) => ({
    data: url.endsWith("/sources") ? { sources } : { articles: [] },
  }));
  window.history.pushState({}, "", "/headlines?source=empty");

  render(<App />);
  await new Promise((resolve) => setTimeout(resolve, 50));

  const headlineCalls = axios.get.mock.calls.filter(([url]) =>
    url.endsWith("/top-headlines"),
  );
  expect(headlineCalls).toHaveLength(1);
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
});

test("shows an error when headlines fail to load", async () => {
  axios.get.mockImplementation(async (url) => {
    if (url.endsWith("/sources")) return { data: { sources } };
    throw new Error("Network Error");
  });
  window.history.pushState({}, "", "/headlines?source=source-1");

  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load headlines: Network Error",
  );
});
