import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Link, MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { makeArticle } from "../testFixtures";
import Headlines from "./Headlines";

vi.mock("axios");

const renderHeadlines = ({ loading = false } = {}) =>
  render(
    <MemoryRouter initialEntries={["/headlines?source=first"]}>
      <Link to="/headlines?source=second">Switch source</Link>
      <Headlines loading={loading} />
    </MemoryRouter>,
  );

const switchSource = () =>
  userEvent.click(screen.getByRole("link", { name: "Switch source" }));

const respondWith = (...titles) => ({
  data: { articles: titles.map(makeArticle) },
});

// A request that stays pending until the test settles it
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// Let resolved requests and the renders they cause finish
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

test("shows the loading text while loading", async () => {
  axios.get.mockResolvedValue(respondWith("A headline"));

  renderHeadlines({ loading: true });
  await flush();

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.queryByText("A headline")).not.toBeInTheDocument();
});

test("requests and shows the headlines of the source in the URL", async () => {
  axios.get.mockResolvedValue(respondWith("A headline"));

  renderHeadlines();

  expect(await screen.findByText("A headline")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledExactlyOnceWith("/api/news/top-headlines", {
    params: { sources: "first" },
  });
  expect(screen.getByText("An Author")).toBeInTheDocument();
  expect(screen.getByText("A summary")).toBeInTheDocument();
  expect(screen.getByText("2026-01-02")).toBeInTheDocument();

  const readMore = screen.getByRole("link", { name: "Read More" });
  expect(readMore).toHaveAttribute("href", "https://example.com/article");
  expect(readMore).toHaveAttribute("target", "_blank");
  expect(readMore).toHaveAttribute("rel", "noopener noreferrer");
});

test("requests a source with no articles only once", async () => {
  axios.get.mockResolvedValue(respondWith());

  renderHeadlines();
  await flush();
  await flush();

  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each([
  [
    "the News API message",
    { response: { data: { message: "Rate limited." } } },
    "Rate limited.",
  ],
  ["a network error", new Error("Network Error"), "Network Error"],
])("shows %s when the request fails", async (_, error, message) => {
  axios.get.mockRejectedValue(error);

  renderHeadlines();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    `Could not load headlines: ${message}`,
  );
});

test("requests again when the source changes", async () => {
  axios.get
    .mockResolvedValueOnce(respondWith("First news"))
    .mockResolvedValueOnce(respondWith("Second news"));
  renderHeadlines();
  await screen.findByText("First news");

  await switchSource();

  expect(await screen.findByText("Second news")).toBeInTheDocument();
  expect(screen.queryByText("First news")).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenLastCalledWith("/api/news/top-headlines", {
    params: { sources: "second" },
  });
});

test("hides the previous articles while the next source loads", async () => {
  axios.get
    .mockResolvedValueOnce(respondWith("First news"))
    .mockReturnValueOnce(deferred().promise);
  renderHeadlines();
  await screen.findByText("First news");

  await switchSource();

  expect(screen.queryByText("First news")).not.toBeInTheDocument();
});

test("lists articles that share a title without a key warning", async () => {
  const consoleError = vi.spyOn(console, "error");
  const articles = ["one", "two"].map((id) => ({
    ...makeArticle("Same title"),
    url: `https://example.com/${id}`,
  }));
  axios.get.mockResolvedValue({ data: { articles } });

  renderHeadlines();

  expect(await screen.findAllByText("Same title")).toHaveLength(2);
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test.each([
  ["response", (request) => request.resolve(respondWith("Old news"))],
  ["failure", (request) => request.reject(new Error("Old failure"))],
])("ignores a late %s for the previous source", async (_, settle) => {
  const old = deferred();
  axios.get
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(respondWith("Second news"));
  renderHeadlines();
  await switchSource();
  await screen.findByText("Second news");

  settle(old);
  await flush();

  expect(screen.getByText("Second news")).toBeInTheDocument();
  expect(screen.queryByText("Old news")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("does not carry an error over to another source", async () => {
  const next = deferred();
  axios.get
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockReturnValueOnce(next.promise);
  renderHeadlines();
  await screen.findByRole("alert");

  await switchSource();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  next.resolve(respondWith("Second news"));
  expect(await screen.findByText("Second news")).toBeInTheDocument();
});
