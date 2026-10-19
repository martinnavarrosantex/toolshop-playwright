import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'html',
  use: {
    baseURL: 'https://practicesoftwaretesting.com',
    // Toolshop marca los elementos con data-test (no data-testid, que es el default de Playwright).
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
