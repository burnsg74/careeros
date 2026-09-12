import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3005',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/vitest-setup.ts'],
  },
  resolve: process.env.VITEST
    ? {
        conditions: ['browser'],
      }
    : undefined,
})
