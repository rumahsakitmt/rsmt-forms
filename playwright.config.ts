import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "BETTER_AUTH_URL=http://127.0.0.1:3100 bun run start -- -p 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
