const { defineConfig } = require("@playwright/test");
const e2ePort = 3101;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    ...(process.env.CI
      ? {}
      : {
          launchOptions: {
            executablePath:
              "C:/Program Files/Google/Chrome/Application/chrome.exe",
          },
        }),
  },
  webServer: {
    command: "node scripts/start-memory.js",
    env: { ...process.env, PORT: String(e2ePort), DB_DRIVER: "memory" },
    url: `http://127.0.0.1:${e2ePort}/api/health`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
  },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
});
