import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Requires the API + web servers running and a migrated+seeded DB.
 * Run:  npx playwright install && npx playwright test
 * Env:  E2E_BASE_URL (default http://localhost:3000)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "ar",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 12"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
