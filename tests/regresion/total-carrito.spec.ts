// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { agregarProducto, dinero, filaCarrito, Producto, productosConStock } from './helpers';

test.describe('Carrito', () => {
  test('4. Total del carrito con varios productos y cantidades', async ({ page }) => {
    // 1. Precondición: carrito vacío. Agregar tres productos con stock: x3, x1 y x2.
    const [a, b, c] = await productosConStock(page, 3);
    const lineas: [Producto, number][] = [[a, 3], [b, 1], [c, 2]];
    for (const [producto, cantidad] of lineas) {
      await agregarProducto(page, producto.nombre, cantidad);
    }
    await expect(page.getByTestId('cart-quantity')).toHaveText('6');

    // 2. Abrir /checkout y revisar cantidad, precio unitario y subtotal de cada fila, y el total.
    await page.goto('/checkout');
    await expect(page.getByTestId('product-title')).toHaveCount(3);
    let total = 0;
    for (const [producto, cantidad] of lineas) {
      const fila = filaCarrito(page, producto.nombre);
      await expect(fila.getByTestId('product-quantity')).toHaveValue(String(cantidad));
      await expect(fila.getByTestId('product-price')).toHaveText(dinero(producto.precio));
      await expect(fila.getByTestId('line-price')).toHaveText(dinero(producto.precio * cantidad));
      total += producto.precio * cantidad;
    }
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(total));
  });
});
