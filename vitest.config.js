import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use JSDOM environment for DOM testing
    environment: 'jsdom',

    // Test file patterns - include tests in new app/src structure
    include: ['app/src/**/*.{test,spec}.{js,mjs,ts}', '**/*.{test,spec}.{js,mjs,ts}'],
    exclude: ['node_modules', 'app/lib'],

    // Enable globals for test environment (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'app/lib/',
        '**/*.{test,spec}.{js,mjs,ts}',
        '**/vitest.config.js',
        '**/eslint.config.js',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
})
