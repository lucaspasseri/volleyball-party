import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  outputDir: "test-results-rsvp",
  testDir: "./tests/e2e-rsvp",
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node --import tsx tests/fixtures/neon-auth-server.ts",
      url: "http://127.0.0.1:54326/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 3101",
      url: "http://localhost:3101",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        RSVP_TEST_DIST_DIR: ".next-rsvp-test",
        NEON_AUTH_BASE_URL: "http://127.0.0.1:54326/test/auth",
        NEON_AUTH_COOKIE_SECRET: "test-cookie-secret-only-for-playwright",
        SITE_URL: "http://localhost:3101",
      },
    },
  ],
});
