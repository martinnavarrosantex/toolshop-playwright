// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { abrirProducto, productoSinStock, productosConStock } from './helpers';

test.describe('Producto', () => {
  test('6. Producto sin stock no se puede agregar al carrito', async ({ page }) => {
    // Toolshop es compartido y el stock cambia: se eligen en el momento un producto agotado
    // y uno con stock (para el contraste).
    const agotado = await productoSinStock(page);
    test.skip(!agotado, 'En este momento Toolshop no tiene ningún producto agotado');
    const nombre = agotado!.nombre;
    const [conStock] = await productosConStock(page, 1);

    // 1. Buscar el producto agotado: su tarjeta muestra 'Out of stock'. Abrirlo.
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Search' }).fill(nombre);
    await page.getByRole('textbox', { name: 'Search' }).press('Enter');
    // La búsqueda puede traer más de un producto: se mira solo la tarjeta del agotado.
    const tarjeta = page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) });
    await expect(tarjeta.getByTestId('out-of-stock')).toBeVisible();
    await abrirProducto(page, nombre);
    await expect(page.getByTestId('out-of-stock')).toHaveText('Out of stock');

    // 2. Verificar el botón Add to cart.
    const agregar = page.getByTestId('add-to-cart');
    await expect(agregar).toBeDisabled();
    await agregar.click({ force: true });
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);

    // 3. Abrir /checkout.
    await page.goto('/checkout');
    await expect(page.getByTestId('product-title')).toHaveCount(0);

    // 4. Contraste: un producto con stock sí se puede agregar.
    await abrirProducto(page, conStock.nombre);
    await expect(page.getByTestId('out-of-stock')).toHaveCount(0);
    await expect(page.getByTestId('add-to-cart')).toBeEnabled();
  });
});
