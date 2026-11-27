# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A small React 19 app (Vite, React Router 8, TypeScript) that lists news sources from [News API](https://newsapi.org/) and shows the top headlines for a chosen source.

## Secrets

Never read, print or edit `.env`, `.env.local`, `.env.*.local` or `src/API_Key.js`, by any tool or command. They hold the News API key. `.claude/settings.json` denies the direct routes; do not work around it. To run the app without the real key, use `NEWS_API_KEY=dummy npm start` (News API then answers 401).

A key was once committed by accident and had to be regenerated. The Vite servers can serve files under `src/`, so never put secrets there.

## Commands

```sh
npm start                                # dev server on port 3000
npm run build                            # tsc -b, then build into build/
npm run preview                          # serve the build with the proxy (port 4173)
npm run typecheck
npm run lint

npm test                                 # Vitest watch mode
npm test -- --run                        # one run
npm test -- --run src/App.test.tsx       # single file
npm test -- --run -t "twelve sources"    # tests by name
npm run test:ui                          # Vitest UI (port 51204)
npx vite preview --outDir .vitest        # Vitest HTML report

npm run test:e2e                         # Playwright, five browser projects
npm run test:e2e -- --project=chromium e2e/pagination.spec.ts
npm run test:e2e -- -g "scrolls to the top"
npm run test:e2e:ui                      # Playwright UI mode
npx playwright show-report               # Playwright HTML report
```

Vitest and Playwright do not type-check, so run `npm run typecheck` too.

## Architecture

### Data flow

- The browser never holds the API key. Code requests `/api/news/...`; the proxy in `vite.config.ts` rewrites it to `https://newsapi.org/v2/...` and adds `X-Api-Key` from `NEWS_API_KEY`. Do not give that variable a `VITE_` prefix, which would expose it to client code. The proxy exists only under the Vite dev and preview servers, and is off in `test` mode so the Vitest UI server cannot use the key.
- All requests go through `src/api.ts` (10 s timeout). It validates responses against the Zod (`zod/mini`) schemas in `src/types.ts`, from which the types are inferred: invalid and duplicate items are dropped, and a wrong shape or an all-invalid list is an error.
- Failures show in `ErrorAlert` with a "Try again" button. `src/getErrorMessage.ts` turns errors into messages, preferring News API's own. It checks errors by shape rather than with `axios.isAxiosError`, because tests mock all of axios.

### State and components

- `src/App.tsx` owns the router and the sources state: it fetches the list once, filters it by the search query (`filterSources.ts`), then paginates the matches on the client. The state sits above the routes, so the query and page survive a visit to headlines. A new query returns to page 1.
- There are 12 sources per page so that full pages fill the 1, 2 and 3 column grids; keep the number divisible by those.
- `Sources`, `SearchFilter` and `Pagination` hold no app state.
- `Headlines.tsx` is independent of the sources request. It reads `?source=<id>` (set by the link in `Sources.tsx`) and shows error, loading, "No headlines" or the articles. Its result and error are tagged with their source, so data of a previous source is never shown.
- `Pagination.tsx` keeps one row at every width: it measures itself with `ResizeObserver` and shows as many page numbers as fit between the first, previous, next and last buttons. Its `BUTTON_WIDTH` and `GAP` must match `.app-pagination` in `App.css`.

### Styling

Bootstrap 5 (npm, CSS only, no Bootstrap JS), then `src/gta-vi-theme.css`, then `src/App.css`, imported in that order by `src/index.tsx`. The theme file is portable: leave it as is and put app styles in `App.css`, using the theme's color variables. It needs `class="app-body"` on `<body>` and the Google Fonts linked in `index.html`. Touch targets are at least 44 px.

### TypeScript

Strict mode, with `tsconfig.app.json` for `src/` and `tsconfig.node.json` for the configs and `e2e/`. Stay below TypeScript 6.1 until `typescript-eslint` supports newer versions.

## Tests

- Vitest files sit next to the code they cover. Tests that make requests mock axios; shared data is in `src/testFixtures.ts`. `mockReset` is on, so set mock behaviour inside each test or `beforeEach`.
- jsdom has no layout or scrolling: `Pagination` tests fake `ResizeObserver`, and `App` tests stub `window.scrollTo`.
- Any test of the Vite config must mock `loadEnv`, so the real key is never read.
- Playwright tests are in `e2e/` (excluded from Vitest). Import `test` from `e2e/fixtures.ts`, which mocks the API and external sites. Its server runs `vite --mode test` on port 3100, so the proxy is off; keep it that way and keep `reuseExistingServer: false`.
- Reporters: `default` and `html` for Vitest (report in `.vitest/`), `list` and `html` for Playwright.

## Comments

Use JSDoc for larger entities (components, functions, types, constants) and line comments for steps and simpler parts. Explain why and how data moves rather than restating the code. Do not repeat TypeScript types in JSDoc.
