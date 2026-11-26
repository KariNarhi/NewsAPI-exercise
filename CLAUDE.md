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
npm test -- --run                        # one run
npm test -- --run src/App.test.jsx       # single file
npm test -- --run -t "paginates"         # single test by name
```

## Architecture

- The browser never holds the API key. Code requests `/api/news/...`; the proxy in `vite.config.js` rewrites it to `https://newsapi.org/v2/...` and adds `X-Api-Key` from `NEWS_API_KEY`. Do not rename it with a `VITE_` prefix, which would expose it to client code. The proxy exists only under the Vite dev and preview servers.
- `src/App.jsx` owns the router (`react-router`), fetches the source list once on mount and paginates it on the client (10 per page). `Sources` and `Pagination` are presentational.
- `src/components/Headlines.jsx` fetches its own data for the `?source=<id>` search parameter set by `Sources.jsx`. The `loading` prop it receives from `App` tracks the *sources* request, not the headlines request.
- `Headlines.jsx` fetches in an effect keyed on the source, so an empty result shows an empty list.
- Both requests show failures in a Bootstrap alert, with the message taken by `src/getErrorMessage.js`.
- Tests (`src/App.test.jsx`) mock axios and render the whole `App` in jsdom.
- Styling is Bootstrap 4.4.1 from a CDN `<link>` in `index.html` (no npm package, no Bootstrap JS).
