import { expect, test } from "vitest";
import getErrorMessage from "./getErrorMessage";

test("prefers the message from News API", () => {
  const error = {
    message: "Request failed with status code 401",
    response: { data: { message: "Your API key is invalid." } },
  };

  expect(getErrorMessage(error)).toBe("Your API key is invalid.");
});

test.each([
  ["there is no response", {}],
  ["the response has no data", { response: {} }],
  ["the data has no message", { response: { data: "<html></html>" } }],
])("falls back to the error's own message when %s", (_, extra) => {
  expect(getErrorMessage({ message: "Network Error", ...extra })).toBe(
    "Network Error",
  );
});
