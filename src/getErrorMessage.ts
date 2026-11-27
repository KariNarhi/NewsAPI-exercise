/** The parts of an axios error that decide the message. */
interface RequestError {
  message?: string;
  code?: string;
  response?: { status?: number; data?: { message?: unknown } };
}

/** Message for an HTTP error status that came without an explanation. */
const statusMessage = (status: number) => {
  if (status === 401) return "The API key was rejected.";
  if (status === 429) return "Too many requests. Wait a while and try again.";
  if (status >= 500) return `The news service is unavailable (HTTP ${status}).`;
  return `The request failed (HTTP ${status}).`;
};

/**
 * Turns anything thrown by a request into a message for the user.
 *
 * Checked from most to least specific: News API's own message, the HTTP status,
 * a timeout, a lost connection, and finally the error's own message.
 *
 * @param error - Value caught from `fetchSources` or `fetchArticles`.
 */
const getErrorMessage = (error: unknown): string => {
  // Checked by shape: axios errors carry `code` and sometimes `response`
  const { message, code, response } = (error ?? {}) as RequestError;

  // News API explains failures itself, e.g. an invalid key or rate limit
  const apiMessage = response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage) return apiMessage;
  if (response?.status) return statusMessage(response.status);

  // No response at all: tell a timeout apart from no connection
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return "The request timed out.";
  }
  if (code === "ERR_NETWORK" || message === "Network Error") {
    return "No connection. Check your network and try again.";
  }
  return message || "Something went wrong.";
};

export default getErrorMessage;
