// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  agregarProducto,
  completarDireccionYContinuar,
  dinero,
  productosConStock,
  confirmarPago,
  filaCarrito,
  iniciarSesion,
  registrarCuenta,
} from './helpers';

test.describe('Checkout', () => {
  test('1. Checkout completo con usuario logueado', async ({ page }) => {
    // 1. Precondición: cuenta propia registrada, carrito vacío. Iniciar sesión.
    const cuenta = await registrarCuenta(page, 'checkout');
    await iniciarSesion(page, cuenta);
    await expect(page.getByTestId('nav-menu')).toContainText('Ana Prueba');

    // 2. Agregar al carrito un producto con stock.
    const [producto] = await productosConStock(page, 1);
    await agregarProducto(page, producto.nombre);
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');

    // 3. Abrir /checkout y revisar la tabla. Clic en proceed-1.
    await page.goto('/checkout');
    const fila = filaCarrito(page, producto.nombre);
    await expect(fila.getByTestId('product-quantity')).toHaveValue('1');
    await expect(fila.getByTestId('product-price')).toHaveText(dinero(producto.precio));
    await expect(fila.getByTestId('line-price')).toHaveText(dinero(producto.precio));
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(producto.precio));
    await page.getByTestId('proceed-1').click();
    // El paso Sign in ya está resuelto por la sesión (proceed-2 solo confirma).
    await expect(page.getByText('you are already logged in')).toBeVisible();
    await page.getByTestId('proceed-2').click();

    // 4. Completar dirección y clic en proceed-3.
    await completarDireccionYContinuar(page);
    await expect(page.getByTestId('payment-method')).toBeVisible();

    // 5. Elegir un medio de pago, completar sus datos y confirmar.
    await page.getByTestId('payment-method').selectOption('bank-transfer');
    await page.getByTestId('bank_name').fill('Banco Test');
    await page.getByTestId('account_name').fill('Ana Prueba');
    await page.getByTestId('account_number').fill('1234567890');
    const confirmacion = await confirmarPago(page);
    const factura = (await confirmacion.innerText()).match(/INV-\d+/)![0];

    // El carrito queda vacío. Se verifica antes de navegar: la app lo vacía con un
    // DELETE /carts después de confirmar, y navegar antes cancela esa request.
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);

    // El pedido figura en /account/invoices.
    await page.goto('/account/invoices');
    await expect(page.getByRole('cell', { name: factura })).toBeVisible();
  });
});
