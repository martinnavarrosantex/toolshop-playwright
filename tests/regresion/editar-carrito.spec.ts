// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { agregarProducto, filaCarrito } from './helpers';

test.describe('Carrito', () => {
  test('5. Cambiar cantidad y quitar productos recalcula el total', async ({ page }) => {
    // 1. Precondición: carrito con Hammer x1 y Pliers x1, total $24.59.
    await agregarProducto(page, 'Hammer');
    await agregarProducto(page, 'Pliers');
    await page.goto('/checkout');
    await expect(page.getByTestId('cart-total')).toHaveText('$24.59');

    // 2. Cambiar product-quantity de Hammer a 4 y salir del campo.
    const hammer = filaCarrito(page, 'Hammer');
    await hammer.getByTestId('product-quantity').fill('4');
    await hammer.getByTestId('product-quantity').blur();
    await expect(hammer.getByTestId('line-price')).toHaveText('$50.32');
    await expect(page.getByTestId('cart-total')).toHaveText('$62.33');

    // 3. Negativo: cantidad 0 o un valor negativo. Observado: la cantidad vuelve a 1.
    await hammer.getByTestId('product-quantity').fill('0');
    await hammer.getByTestId('product-quantity').blur();
    await expect(hammer.getByTestId('product-quantity')).toHaveValue('1');
    await expect(hammer.getByTestId('line-price')).toHaveText('$12.58');
    await expect(page.getByTestId('cart-total')).toHaveText('$24.59');
    await hammer.getByTestId('product-quantity').fill('-2');
    await hammer.getByTestId('product-quantity').blur();
    await expect(hammer.getByTestId('product-quantity')).toHaveValue('1');
    await expect(page.getByTestId('cart-total')).toHaveText('$24.59');
    await hammer.getByTestId('product-quantity').fill('4');
    await hammer.getByTestId('product-quantity').blur();
    await expect(page.getByTestId('cart-total')).toHaveText('$62.33');

    // 4. Quitar la fila de Pliers con el ícono de eliminar.
    // El ícono no tiene rol ni data-test: se hace clic en la celda de acciones, sobre el botón.
    const pliers = filaCarrito(page, 'Pliers');
    await pliers.getByRole('cell').last().click({ position: { x: 27, y: 27 } });
    await expect(page.getByTestId('product-title')).toHaveCount(1);
    await expect(page.getByTestId('cart-total')).toHaveText('$50.32');

    // 5. Quitar el último producto.
    await filaCarrito(page, 'Hammer').getByRole('cell').last().click({ position: { x: 27, y: 27 } });
    await expect(page.getByTestId('product-title')).toHaveCount(0);
    await expect(page.getByText('The cart is empty. Nothing to display.')).toBeVisible();
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  });
});
