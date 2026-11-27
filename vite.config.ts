/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Configuration of the dev server, the build and Vitest. */
export default defineConfig(({ mode }) => {
  // Runs in Node only. The NEWS_ prefix is not exposed to browser code.
  const env = loadEnv(mode, process.cwd(), "NEWS_");

  return {
    // JSX transform and fast refresh
    plugins: [react()],
    server: {
      port: 3000,
      // Also used by `vite preview`. Off in test runs, so that the Vitest UI
      // server cannot be used to call News API with the key.
      // The browser calls /api/news/*; this server calls News API and adds the key
      proxy: mode === "test" ? undefined : {
        "/api/news": {
          target: "https://newsapi.org",
          changeOrigin: true,
          // /api/news/sources -> /v2/sources
          rewrite: (path) => path.replace(/^\/api\/news/, "/v2"),
          headers: env.NEWS_API_KEY ? { "X-Api-Key": env.NEWS_API_KEY } : {},
        },
      },
    },
    // `npm run build` output; listed in .gitignore
    build: {
      outDir: "build",
    },
    test: {
      // Settings of Vitest
      environment: "jsdom",
      exclude: ["**/node_modules/**", "**/.git/**", "e2e/**"], // Playwright
      // Mocks start clean in every test
      mockReset: true,
      // Terminal output, plus an HTML report in .vitest/
      reporters: ["default", "html"],
      setupFiles: "./src/setupTests.ts",
    },
  };
});
