# Simple News API App made with React

[Powered by News API](https://newsapi.org/).

#### Note: the API key found in commit history was an accidental commit and has now been regenerated, and thus making the old key invalid.

---

Browse news sources and read the top headlines of each one.

## Features

- Sources as a card grid, 12 per page
- Search by name or description, with pagination that follows the results
- Top headlines of a chosen source
- One-row pagination with first, previous, next and last buttons
- Responsive "Vice City" theme for phones, tablets and desktops
- Error messages with a "Try again" button, and a 10 second request timeout
- Validation of API responses: invalid entries are skipped and reported in the browser console

Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [React Router](https://reactrouter.com/), [Bootstrap](https://getbootstrap.com/), [axios](https://axios-http.com/) and [Zod](https://zod.dev/). Tested with [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [Playwright](https://playwright.dev/).

## Setup

Requires Node `^22.22.2`, `^24.15.0` or `>=26`, and a free or paid [News API](https://newsapi.org/) key.

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `NEWS_API_KEY` to your key. The file is gitignored. A `NEWS_API_KEY` shell variable overrides it.
3. `npm start` and open [http://localhost:3000](http://localhost:3000).

Restart the server after changing the key.

## Scripts

| Command                     | What it does                                    |
| --------------------------- | ----------------------------------------------- |
| `npm start` / `npm run dev` | Development server on port 3000                 |
| `npm run build`             | Type check, then production build into `build/` |
| `npm run preview`           | Serve the build on port 4173                    |
| `npm run typecheck`         | TypeScript check                                |
| `npm run lint`              | ESLint                                          |
| `npm test`                  | Vitest in watch mode                            |
| `npm run test:ui`           | Vitest UI                                       |
| `npm run test:e2e`          | Playwright end-to-end tests                     |
| `npm run test:e2e:ui`       | Playwright UI mode                              |

## Testing

Neither Vitest nor Playwright checks types, so run `npm run typecheck` as well. No test needs an API key: the API is mocked.

### Unit and component tests (Vitest)

Test files sit next to the code in `src/`. Each run prints results in the terminal and writes an HTML report to `.vitest/`; view it with `npx vite preview --outDir .vitest` and open the URL it prints.

`npm run test:ui` starts Vitest UI. Open the URL printed in the terminal, including its token.

### End-to-end tests (Playwright)

The tests in `e2e/` run in Chromium, Firefox and WebKit, including two emulated phones. Install the browsers once with `npx playwright install`. Results are listed in the terminal, and `npx playwright show-report` opens the HTML report.

## API key and proxy

The browser calls `/api/news/...`. The Vite server forwards the request to `https://newsapi.org/v2/...` and adds the key, so the key is not part of the browser code.

The proxy exists in `npm start` and `npm run preview`, and is off during test runs. A static host serving `build/` has to provide the same `/api/news` forwarding itself, including the `X-Api-Key` header.

While a server with the proxy is running, any program on your computer can use it, and so use your key's quota. Do not put secrets under `src/`, because the Vite servers can serve those files.

## Project layout

| Path              | Contents                                         |
| ----------------- | ------------------------------------------------ |
| `src/`            | App code and its Vitest tests                    |
| `src/components/` | React components                                 |
| `e2e/`            | Playwright tests                                 |
| `public/`         | Favicon and web app manifest                     |
| `vite.config.ts`  | Dev server, API proxy, build and Vitest settings |

The fonts of the theme are loaded from Google Fonts.

## License

[MIT](LICENSE)
