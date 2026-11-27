/** Runs before every Vitest test file (see `test.setupFiles` in vite.config.ts). */

// Adds DOM matchers such as toBeInTheDocument()
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount between tests; without Vitest globals this is not automatic
afterEach(cleanup);
