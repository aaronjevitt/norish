import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Each worker boots a whole stack (server, parser, Postgres, Redis) beside its
  // browser, so a worker costs two to three cores. On a 10-core Mac 4 workers
  // ran the suite in 5 minutes; 5 and 8 overloaded it into timing reds. CI
  // runners have 4 vCPUs, so CI takes its parallelism from shards instead.
  workers: process.env.CI ? 1 : "40%",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  outputDir: "./.results",
  use: {
    headless: true,
    serviceWorkers: "allow",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "offline", testMatch: "offline/**/*.e2e.ts" },
    { name: "ai", testMatch: "ai/**/*.e2e.ts" },
    { name: "realtime", testMatch: "realtime/**/*.e2e.ts" },
  ],
});
