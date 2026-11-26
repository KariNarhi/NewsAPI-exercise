import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "build",
    ".vitest",
    "test-results",
    "playwright-report",
    "blob-report",
    "src/API_Key.js",
  ]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["vite.config.js", "vite.config.test.js"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["playwright.config.js", "e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
