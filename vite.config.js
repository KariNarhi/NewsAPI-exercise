import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Runs in Node only. The NEWS_ prefix is not exposed to browser code.
  const env = loadEnv(mode, process.cwd(), "NEWS_");

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Also used by `vite preview`. Off in test runs, so that the Vitest UI
      // server cannot be used to call News API with the key.
      proxy: mode === "test" ? undefined : {
        "/api/news": {
          target: "https://newsapi.org",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/news/, "/v2"),
          headers: env.NEWS_API_KEY ? { "X-Api-Key": env.NEWS_API_KEY } : {},
        },
      },
    },
    build: {
      outDir: "build",
    },
    test: {
      environment: "jsdom",
      mockReset: true,
      reporters: ["default", "html"],
      setupFiles: "./src/setupTests.js",
    },
  };
});
