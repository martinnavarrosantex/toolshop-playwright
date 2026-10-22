// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { agregarProducto, dinero, filaCarrito, productosConStock } from './helpers';

test.describe('Carrito', () => {
  test('5. Cambiar cantidad y quitar productos recalcula el total', async ({ page }) => {
    // 1. Precondición: carrito con dos productos con stock (A y B), una unidad de cada uno.
    const [a, b] = await productosConStock(page, 2);
    await agregarProducto(page, a.nombre);
    await agregarProducto(page, b.nombre);
    await page.goto('/checkout');
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio + b.precio));

    // 2. Cambiar la cantidad de A a 4 y salir del campo.
    const filaA = filaCarrito(page, a.nombre);
    await filaA.getByTestId('product-quantity').fill('4');
    await filaA.getByTestId('product-quantity').blur();
    await expect(filaA.getByTestId('line-price')).toHaveText(dinero(a.precio * 4));
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio * 4 + b.precio));

    // 3. Negativo: cantidad 0 o un valor negativo. Observado: la cantidad vuelve a 1.
    await filaA.getByTestId('product-quantity').fill('0');
    await filaA.getByTestId('product-quantity').blur();
    await expect(filaA.getByTestId('product-quantity')).toHaveValue('1');
    await expect(filaA.getByTestId('line-price')).toHaveText(dinero(a.precio));
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio + b.precio));
    await filaA.getByTestId('product-quantity').fill('-2');
    await filaA.getByTestId('product-quantity').blur();
    await expect(filaA.getByTestId('product-quantity')).toHaveValue('1');
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio + b.precio));
    await filaA.getByTestId('product-quantity').fill('4');
    await filaA.getByTestId('product-quantity').blur();
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio * 4 + b.precio));

    // 4. Quitar la fila de B con el ícono de eliminar.
    // El ícono no tiene rol ni data-test: se hace clic en la celda de acciones, sobre el botón.
    const filaB = filaCarrito(page, b.nombre);
    await filaB.getByRole('cell').last().click({ position: { x: 27, y: 27 } });
    await expect(page.getByTestId('product-title')).toHaveCount(1);
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(a.precio * 4));

    // 5. Quitar el último producto.
    await filaCarrito(page, a.nombre).getByRole('cell').last().click({ position: { x: 27, y: 27 } });
    await expect(page.getByTestId('product-title')).toHaveCount(0);
    await expect(page.getByText('The cart is empty. Nothing to display.')).toBeVisible();
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  });
});
