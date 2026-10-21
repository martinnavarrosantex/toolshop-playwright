// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { agregarProducto, filaCarrito } from './helpers';

test.describe('Carrito', () => {
  test('4. Total del carrito con varios productos y cantidades', async ({ page }) => {
    // 1. Precondición: carrito vacío. Agregar Hammer x3, Pliers x1 y Slip Joint Pliers x2.
    await agregarProducto(page, 'Hammer', 3);
    await agregarProducto(page, 'Pliers', 1);
    await agregarProducto(page, 'Slip Joint Pliers', 2);
    await expect(page.getByTestId('cart-quantity')).toHaveText('6');

    // 2. Abrir /checkout y revisar product-title, product-quantity, product-price, line-price y cart-total.
    await page.goto('/checkout');
    await expect(page.getByTestId('product-title')).toHaveCount(3);

    const hammer = filaCarrito(page, 'Hammer');
    await expect(hammer.getByTestId('product-quantity')).toHaveValue('3');
    await expect(hammer.getByTestId('product-price')).toHaveText('$12.58');
    await expect(hammer.getByTestId('line-price')).toHaveText('$37.74');

    const pliers = filaCarrito(page, 'Pliers');
    await expect(pliers.getByTestId('product-quantity')).toHaveValue('1');
    await expect(pliers.getByTestId('product-price')).toHaveText('$12.01');
    await expect(pliers.getByTestId('line-price')).toHaveText('$12.01');

    const slip = filaCarrito(page, 'Slip Joint Pliers');
    await expect(slip.getByTestId('product-quantity')).toHaveValue('2');
    await expect(slip.getByTestId('product-price')).toHaveText('$9.17');
    await expect(slip.getByTestId('line-price')).toHaveText('$18.34');

    // 37.74 + 12.01 + 18.34 = 68.09
    await expect(page.getByTestId('cart-total')).toHaveText('$68.09');
  });
});
