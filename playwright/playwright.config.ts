import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './scripts',
  timeout: 60_000,
  use: {
    headless: true,
  },
})
