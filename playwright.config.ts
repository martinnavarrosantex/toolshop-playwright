import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  // Un solo worker también en local: Toolshop es una demo compartida y varios tests crean cuentas;
  // en paralelo, el registro llega a tardar más de lo que espera el test.
  workers: 1,
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
