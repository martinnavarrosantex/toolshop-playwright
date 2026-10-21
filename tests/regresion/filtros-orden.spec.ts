// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Catálogo', () => {
  test('8. Filtros por categoría y marca, y orden por precio', async ({ page }) => {
    const nombres = page.getByTestId('product-name');
    const precios = page.getByTestId('product-price');
    const orden = page.getByRole('combobox', { name: 'sort' });

    const leerPrecios = async () =>
      (await precios.allInnerTexts()).map((p) => Number(p.replace('$', '')));
    const leerNombres = async () => await nombres.allInnerTexts();

    // 1. En la home elegir en sort 'Price (Low - High)'.
    await page.goto('/');
    await expect(nombres).toHaveCount(9);
    await orden.selectOption('Price (Low - High)');
    await expect(precios.first()).toHaveText('$3.55');
    const asc = await leerPrecios();
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    // 2. Elegir 'Price (High - Low)'.
    await orden.selectOption('Price (High - Low)');
    await expect(precios.first()).toHaveText('$89.55');
    const desc = await leerPrecios();
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    // 3. Marcar la categoría Pliers.
    await page.getByRole('checkbox', { name: 'Pliers', exact: true }).check();
    await expect(nombres).toHaveCount(5);
    expect((await leerNombres()).sort()).toEqual(
      ['Bolt Cutters', 'Combination Pliers', 'Long Nose Pliers', 'Pliers', 'Slip Joint Pliers'].sort()
    );

    // 4. Marcar además la marca ForgeFlex Tools.
    await page.getByRole('checkbox', { name: 'ForgeFlex Tools' }).check();
    await expect(nombres).toHaveCount(2);
    expect((await leerNombres()).sort()).toEqual(['Combination Pliers', 'Pliers']);

    // 5. Desmarcar los filtros. Probar también Name (A-Z) y Name (Z-A).
    await page.getByRole('checkbox', { name: 'ForgeFlex Tools' }).uncheck();
    await page.getByRole('checkbox', { name: 'Pliers', exact: true }).uncheck();
    await expect(nombres).toHaveCount(9);
    await orden.selectOption('Name (A - Z)');
    await expect(nombres.first()).toHaveText('Adjustable Wrench');
    const az = await leerNombres();
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b)));
    await orden.selectOption('Name (Z - A)');
    await expect(nombres.first()).not.toHaveText('Adjustable Wrench');
    const za = await leerNombres();
    expect(za).toEqual([...za].sort((a, b) => b.localeCompare(a)));

    // 6. Combinar categoría con una búsqueda sin coincidencias.
    await page.getByRole('checkbox', { name: 'Pliers', exact: true }).check();
    await expect(nombres).toHaveCount(5);
    await page.getByRole('textbox', { name: 'Search' }).fill('zzzzxx');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('no-results')).toHaveText('There are no products found.');
    await expect(nombres).toHaveCount(0);
  });
});
