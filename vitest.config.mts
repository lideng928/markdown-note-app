import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': import.meta.dirname },
  },
  test: {
    // Every unit-tested module is pure logic; the DOM layer is covered by Playwright.
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
