import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Lint rules (ESLint flat config). */
export default defineConfig([
  // Generated output, and the secret file so that no tool reads it
  globalIgnores([
    "build",
    ".vitest",
    "test-results",
    "playwright-report",
    "blob-report",
    "src/API_Key.js",
  ]),
  {
    // Rules for all TypeScript; code runs in the browser by default
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // These run in Node
    files: ["vite.config.ts", "vite.config.test.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    // Playwright code runs in Node, but page.evaluate() bodies in the browser
    files: ["playwright.config.ts", "e2e/**/*.ts"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
