import { expect, test } from "vitest";
import getErrorMessage from "./getErrorMessage";

test("prefers the message from News API", () => {
  const error = {
    message: "Request failed with status code 401",
    response: { status: 401, data: { message: "Your API key is invalid." } },
  };

  expect(getErrorMessage(error)).toBe("Your API key is invalid.");
});

test.each([
  [401, "The API key was rejected."],
  [429, "Too many requests. Wait a while and try again."],
  [500, "The news service is unavailable (HTTP 500)."],
  [503, "The news service is unavailable (HTTP 503)."],
  [404, "The request failed (HTTP 404)."],
])("explains HTTP %i without a message", (status, expected) => {
  expect(getErrorMessage({ response: { status, data: "" } })).toBe(expected);
});

test.each([
  [{ code: "ECONNABORTED" }, "The request timed out."],
  [{ code: "ETIMEDOUT" }, "The request timed out."],
  [
    { code: "ERR_NETWORK" },
    "No connection. Check your network and try again.",
  ],
  [
    new Error("Network Error"),
    "No connection. Check your network and try again.",
  ],
  [new Error("Something odd"), "Something odd"],
  [{}, "Something went wrong."],
  [undefined, "Something went wrong."],
])("explains %o", (error, expected) => {
  expect(getErrorMessage(error)).toBe(expected);
});
