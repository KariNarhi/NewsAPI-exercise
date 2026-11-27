# Simple News API App made with React

[Powered by News API](https://newsapi.org/).

#### Note: the API key found in commit history was an accidental commit and has now been regenerated, and thus making the old key invalid.

---

Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vite.dev/).

## Setup

Requires Node `^22.22.2`, `^24.15.0` or `>=26`.

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `NEWS_API_KEY` to your key. The file is gitignored. A `NEWS_API_KEY` shell variable overrides it.
3. `npm start` and open [http://localhost:3000](http://localhost:3000).

Restart the server after changing the key.

## Scripts

- `npm start` / `npm run dev`: development server
- `npm test`: Vitest in watch mode
- `npm run test:ui`: Vitest UI; open the tokenised URL printed in the terminal
- `npm run test:e2e`: Playwright end-to-end tests
- `npm run test:e2e:ui`: Playwright UI mode
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check
- `npm run build`: type check, then production build into `build/`
- `npm run preview`: serve the build locally

Test runs also write an HTML report to `.vitest/` (gitignored). View it with `npx vite preview --outDir .vitest`.

The end-to-end tests run in Chromium, Firefox and WebKit, including phone emulation, with a mocked API. Install the browsers once with `npx playwright install`. View the last report with `npx playwright show-report`.

## Search

Sources can be searched by name or description; the pagination follows the results.

## Errors and data checks

Failed requests (including a 10 second timeout) show a message with a "Try again" button. Responses are validated; invalid entries are skipped and reported in the browser console.

## API key and proxy

The browser calls `/api/news/...`. The Vite server forwards the request to `https://newsapi.org/v2/...` and adds the key, so the key is not part of the browser code.

The proxy exists only in `npm start` and `npm run preview`. It is off during test runs, including the Vitest UI. A static host serving `build/` has to provide the same `/api/news` forwarding itself.
