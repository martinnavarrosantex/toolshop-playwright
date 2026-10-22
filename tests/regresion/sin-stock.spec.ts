// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { abrirProducto } from './helpers';

test.describe('Producto', () => {
  test('6. Producto sin stock no se puede agregar al carrito', async ({ page }) => {
    // 1. En la home localizar 'Long Nose Pliers' con la etiqueta 'Out of stock' y abrirlo.
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Search' }).fill('Long Nose Pliers');
    await page.getByRole('textbox', { name: 'Search' }).press('Enter');
    // La búsqueda trae más de un producto agotado: se mira solo la tarjeta de Long Nose Pliers.
    const tarjeta = page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: 'Long Nose Pliers', exact: true }) });
    await expect(tarjeta.getByTestId('out-of-stock')).toBeVisible();
    await abrirProducto(page, 'Long Nose Pliers');
    await expect(page.getByTestId('out-of-stock')).toHaveText('Out of stock');

    // 2. Verificar el botón Add to cart.
    const agregar = page.getByTestId('add-to-cart');
    await expect(agregar).toBeDisabled();
    await agregar.click({ force: true });
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);

    // 3. Abrir /checkout.
    await page.goto('/checkout');
    await expect(page.getByTestId('product-title')).toHaveCount(0);
    await expect(page.getByText('Long Nose Pliers')).toHaveCount(0);

    // 4. Contraste: abrir Hammer.
    await abrirProducto(page, 'Hammer');
    await expect(page.getByTestId('out-of-stock')).toHaveCount(0);
    await expect(page.getByTestId('add-to-cart')).toBeEnabled();
  });
});
