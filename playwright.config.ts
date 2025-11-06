import { defineConfig, devices } from '@playwright/test';

// Default to localhost:3001 for development (matches dev:3001 script)
// Can be overridden with BASE_URL environment variable
// Examples:
//   - Local: http://localhost:3001
//   - Alternative: http://localhost:3000
//   - LAN: http://192.168.77.222:3001
//   - Production: https://your-domain.com
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Set viewport for mobile testing
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 7'],
        // Force mobile view with ?pwa=1 query param
        storageState: undefined,
      },
    },
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});

