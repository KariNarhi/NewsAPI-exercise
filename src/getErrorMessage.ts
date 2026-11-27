interface RequestError {
  message?: string;
  code?: string;
  response?: { status?: number; data?: { message?: unknown } };
}

const statusMessage = (status: number) => {
  if (status === 401) return "The API key was rejected.";
  if (status === 429) return "Too many requests. Wait a while and try again.";
  if (status >= 500) return `The news service is unavailable (HTTP ${status}).`;
  return `The request failed (HTTP ${status}).`;
};

// Turns a failed request into a message for the user
const getErrorMessage = (error: unknown): string => {
  // Checked by shape: axios errors carry `code` and sometimes `response`
  const { message, code, response } = (error ?? {}) as RequestError;

  // News API explains failures itself, e.g. an invalid key or rate limit
  const apiMessage = response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage) return apiMessage;
  if (response?.status) return statusMessage(response.status);

  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return "The request timed out.";
  }
  if (code === "ERR_NETWORK" || message === "Network Error") {
    return "No connection. Check your network and try again.";
  }
  return message || "Something went wrong.";
};

export default getErrorMessage;
