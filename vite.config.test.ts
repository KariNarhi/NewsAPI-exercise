// @vitest-environment node
import { loadEnv, type ProxyOptions, type UserConfig } from "vite";
import { expect, test, vi } from "vitest";
import config from "./vite.config";

// Mocked so that these tests never read .env.local and the real API key
vi.mock("vite", () => ({
  defineConfig: (value: unknown) => value,
  loadEnv: vi.fn(),
}));

const loadConfig = (env: Record<string, string>, mode = "development") => {
  vi.mocked(loadEnv).mockReturnValue(env);
  return config({ mode, command: "serve" }) as UserConfig;
};

const newsProxy = (loaded: UserConfig) =>
  loaded.server?.proxy?.["/api/news"] as ProxyOptions;

test("reads only NEWS_ variables", () => {
  loadConfig({});

  expect(loadEnv).toHaveBeenCalledWith("development", process.cwd(), "NEWS_");
});

test("forwards /api/news to News API v2", () => {
  const proxy = newsProxy(loadConfig({}));

  expect(proxy.target).toBe("https://newsapi.org");
  expect(proxy.changeOrigin).toBe(true);
  expect(proxy.rewrite!("/api/news/top-headlines?sources=a")).toBe(
    "/v2/top-headlines?sources=a",
  );
});

test("adds the API key header when a key is set", () => {
  const loaded = loadConfig({ NEWS_API_KEY: "dummy" });

  expect(newsProxy(loaded).headers).toEqual({ "X-Api-Key": "dummy" });
});

test("sends no key header without a key", () => {
  const loaded = loadConfig({ NEWS_API_KEY: "" });

  expect(newsProxy(loaded).headers).toEqual({});
});

test("has no proxy during test runs, even with a key", () => {
  const { server } = loadConfig({ NEWS_API_KEY: "dummy" }, "test");

  expect(server!.proxy).toBeUndefined();
});

test("serves on port 3000 and builds into build/", () => {
  const { server, build } = loadConfig({});

  expect(server!.port).toBe(3000);
  expect(build!.outDir).toBe("build");
});
