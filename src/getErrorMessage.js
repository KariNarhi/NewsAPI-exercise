// News API explains failures in `message`, e.g. an invalid key or rate limit.
const getErrorMessage = (error) =>
  error.response?.data?.message ?? error.message;

export default getErrorMessage;
