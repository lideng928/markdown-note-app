import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
// `localhost`, not 127.0.0.1: Next's dev server rejects asset requests from an
// untrusted host with a 403, which leaves the page blank.
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The dev server, deliberately: the service worker only registers in a
    // production build, and its caching would make these runs non-deterministic.
    command: `npx next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
