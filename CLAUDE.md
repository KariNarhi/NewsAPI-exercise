# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A small React 19 app (Vite, React Router 8, plain JavaScript) that lists news sources from [News API](https://newsapi.org/) and shows the top headlines for a chosen source.

## Secrets

Never read, print or edit `.env`, `.env.local`, `.env.*.local` or `src/API_Key.js`, by any tool or command. They hold the News API key. `.claude/settings.json` denies the direct routes; do not work around it. To run the app without the real key, use `NEWS_API_KEY=dummy npm start` (News API then answers 401).

A key was once committed by accident and had to be regenerated.

## Commands

```sh
npm start                                # dev server on port 3000
npm run lint
npm run build                            # output in build/
npm run preview                          # serve the build, with the proxy
npm test                                 # Vitest watch mode
npm run test:ui                          # Vitest UI (port 51204)
npx vite preview --outDir .vitest        # view the HTML test report
npm test -- --run                        # one run
npm test -- --run src/App.test.jsx       # single file
npm test -- --run -t "twelve sources"    # single test by name
```

## Architecture

- The browser never holds the API key. Code requests `/api/news/...`; the proxy in `vite.config.js` rewrites it to `https://newsapi.org/v2/...` and adds `X-Api-Key` from `NEWS_API_KEY`. Do not rename it with a `VITE_` prefix, which would expose it to client code. The proxy exists only under the Vite dev and preview servers, and is off in `test` mode so the Vitest UI server cannot use the key.
- `src/App.jsx` owns the router (`react-router`), fetches the source list once on mount and paginates it on the client (12 per page, so full pages fill the 1, 2 and 3 column grids; keep it divisible by those). `Sources` and `Pagination` are presentational.
- `src/components/Headlines.jsx` fetches its own data for the `?source=<id>` search parameter set by `Sources.jsx`. The `loading` prop it receives from `App` tracks the *sources* request, not the headlines request.
- `Headlines.jsx` fetches in an effect keyed on the source, so an empty result shows an empty list.
- Both requests show failures in a Bootstrap alert, with the message taken by `src/getErrorMessage.js`.
- Tests sit next to the code they cover: component tests, `App` integration tests and `vite.config.test.js`. They mock axios; shared data is in `src/testFixtures.js`. `mockReset` is on, so set mock behaviour inside each test or `beforeEach`. Any test of the Vite config must mock `loadEnv`, so the real key is never read.
- Test runs use the `default` and `html` reporters; the report goes to `.vitest/`.
- `Pagination.jsx` keeps one row at every width: it measures itself with `ResizeObserver` and shows as many page numbers as fit between the first, previous, next and last buttons. Its `BUTTON_WIDTH` and `GAP` must match `.app-pagination` in `App.css`.
- Styling is Bootstrap 5 (npm, CSS only, no Bootstrap JS), then `src/gta-vi-theme.css`, then `src/App.css`, imported in that order by `src/index.jsx`. The theme file is portable: leave it as is and put app styles in `App.css`, using the theme's color variables. It needs `class="app-body"` on `<body>` and the Google Fonts linked in `index.html`.
