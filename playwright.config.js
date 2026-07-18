import { defineConfig, devices } from "@playwright/test";

const SERVER_PORT = 5100;
const CLIENT_PORT = 5174;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: CLIENT_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npx prisma migrate deploy && npx tsx src/index.ts",
      cwd: "./server",
      url: `${SERVER_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: "test",
        PORT: String(SERVER_PORT),
        CLIENT_URL,
        DATABASE_URL: "file:./prisma/e2e.db",
        JWT_SECRET: "e2e-test-secret-with-enough-length-0123456789",
      },
    },
    {
      command: `npx vite --port ${CLIENT_PORT} --strictPort`,
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_DEV_API_TARGET: SERVER_URL,
      },
    },
  ],
});
