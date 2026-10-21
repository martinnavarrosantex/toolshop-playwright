// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Catálogo', () => {
  test('7. Búsqueda por nombre, con y sin resultados', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Search' });
    const nombres = page.getByTestId('product-name');

    // 1. En la home escribir 'hammer' en Search y clic en Search.
    await page.goto('/');
    await campo.fill('hammer');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: hammer');
    await expect(nombres).toHaveText([
      'Claw Hammer with Shock Reduction Grip',
      'Hammer',
      'Claw Hammer',
      'Thor Hammer',
      'Claw Hammer with Fiberglass Handle',
      'Court Hammer',
    ]);

    // 2. Buscar 'zzzzxx'.
    await campo.fill('zzzzxx');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('no-results')).toHaveText('There are no products found.');
    await expect(nombres).toHaveCount(0);

    // 3. Buscar 'HAMMER' en mayúsculas y luego un término con espacios al final.
    await campo.fill('HAMMER');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: HAMMER');
    await expect(nombres).toHaveCount(6);
    await expect(nombres.filter({ hasText: /^\s*Hammer\s*$/ })).toHaveCount(1);
    await campo.fill('hammer   ');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: hammer');
    await expect(nombres).toHaveCount(6);

    // 4. Clic en el botón X.
    await page.getByRole('button', { name: 'X', exact: true }).click();
    await expect(campo).toHaveValue('');
    await expect(page.getByTestId('search-caption')).toHaveCount(0);
    await expect(nombres).toHaveCount(9);
  });
});
