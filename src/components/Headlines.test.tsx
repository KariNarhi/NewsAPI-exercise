import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Link, MemoryRouter } from "react-router";
import { expect, test, vi, type Mock } from "vitest";
import { makeArticle } from "../testFixtures";
import Headlines from "./Headlines";

vi.mock("axios");
const get = axios.get as Mock;

const renderHeadlines = () =>
  render(
    <MemoryRouter initialEntries={["/headlines?source=first"]}>
      <Link to="/headlines?source=second">Switch source</Link>
      <Headlines />
    </MemoryRouter>,
  );

const switchSource = () =>
  userEvent.click(screen.getByRole("link", { name: "Switch source" }));

const respondWith = (...titles: string[]) => ({
  data: { articles: titles.map((title) => makeArticle(title)) },
});

// A request that stays pending until the test settles it
const deferred = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// Let resolved requests and the renders they cause finish
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

test.each([
  ["articles", respondWith("A headline")],
  ["an empty result", respondWith()],
])("shows the loading text until %s arrive", async (_, response) => {
  const request = deferred();
  get.mockReturnValue(request.promise);

  renderHeadlines();
  expect(screen.getByText("Loading...")).toBeInTheDocument();

  request.resolve(response);
  await flush();
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  expect(screen.queryByText("No headlines") !== null).toBe(
    response.data.articles.length === 0,
  );
});

test("requests and shows the headlines of the source in the URL", async () => {
  get.mockResolvedValue(respondWith("A headline"));

  renderHeadlines();

  expect(await screen.findByText("A headline")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledExactlyOnceWith("/api/news/top-headlines", {
    params: { sources: "first" },
    timeout: 10_000,
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
  get.mockResolvedValue(respondWith());

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
  [
    "a network error",
    new Error("Network Error"),
    "No connection. Check your network and try again.",
  ],
])("shows %s when the request fails", async (_, error, message) => {
  get.mockRejectedValue(error);

  renderHeadlines();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    `Could not load headlines: ${message}`,
  );
});

test("requests again when the source changes", async () => {
  get
    .mockResolvedValueOnce(respondWith("First news"))
    .mockResolvedValueOnce(respondWith("Second news"));
  renderHeadlines();
  await screen.findByText("First news");

  await switchSource();

  expect(await screen.findByText("Second news")).toBeInTheDocument();
  expect(screen.queryByText("First news")).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenLastCalledWith("/api/news/top-headlines", {
    params: { sources: "second" },
    timeout: 10_000,
  });
});

test("hides the previous articles while the next source loads", async () => {
  get
    .mockResolvedValueOnce(respondWith("First news"))
    .mockReturnValueOnce(deferred().promise);
  renderHeadlines();
  await screen.findByText("First news");

  await switchSource();

  expect(screen.queryByText("First news")).not.toBeInTheDocument();
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("lists articles that share a title without a key warning", async () => {
  const consoleError = vi.spyOn(console, "error");
  const articles = ["one", "two"].map((id) => ({
    ...makeArticle("Same title"),
    url: `https://example.com/${id}`,
  }));
  get.mockResolvedValue({ data: { articles } });

  renderHeadlines();

  expect(await screen.findAllByText("Same title")).toHaveLength(2);
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test.each([
  ["response", (request: ReturnType<typeof deferred>) => request.resolve(respondWith("Old news"))],
  ["failure", (request: ReturnType<typeof deferred>) => request.reject(new Error("Old failure"))],
])("ignores a late %s for the previous source", async (_, settle) => {
  const old = deferred();
  get
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
  get
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockReturnValueOnce(next.promise);
  renderHeadlines();
  await screen.findByRole("alert");

  await switchSource();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  next.resolve(respondWith("Second news"));
  expect(await screen.findByText("Second news")).toBeInTheDocument();
});

test("retries after a failure", async () => {
  const second = deferred();
  get
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockReturnValueOnce(second.promise);
  renderHeadlines();

  await userEvent.click(
    await screen.findByRole("button", { name: "Try again" }),
  );
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  second.resolve(respondWith("Recovered"));
  expect(await screen.findByText("Recovered")).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(2);
});

test("shows the alert again when the retry fails", async () => {
  get.mockRejectedValue(new Error("Still down"));
  renderHeadlines();

  await userEvent.click(
    await screen.findByRole("button", { name: "Try again" }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent("Still down");
  expect(get).toHaveBeenCalledTimes(2);
});
