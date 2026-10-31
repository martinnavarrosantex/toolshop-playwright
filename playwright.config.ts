import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // html para mirar las fallas; json para que el pipeline arme el reporte en formato estándar (scripts/reporte-de-fallas.mjs).
  reporter: [['html'], ['json', { outputFile: 'resultados.json' }]],
  use: {
    baseURL: 'https://practicesoftwaretesting.com',
    // Toolshop marca los elementos con data-test (no data-testid, que es el default de Playwright).
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    // La captura del momento de la falla va como evidencia del reporte.
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
