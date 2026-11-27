import { defineConfig, devices } from "@playwright/test";

/** Port of the test server, apart from the dev server's 3000. */
const PORT = 3100;

/** End-to-end tests: real browsers against a Vite server with a mocked API. */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // On CI: fail on a leftover test.only, and retry flaky tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Progress in the terminal, details in playwright-report/
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Record a trace for debugging when a test had to be retried
    trace: "on-first-retry",
  },
  // Every test runs once in each: three engines and two emulated phones
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    // Test mode turns the News API proxy off, so the real key cannot be used.
    // Never reuse a running server, which might have the proxy on.
    command: `npx vite --mode test --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});
