// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  agregarProducto,
  completarDireccionYContinuar,
  confirmarPago,
  dinero,
  filaCarrito,
  productosConStock,
} from './helpers';

test.describe('Checkout', () => {
  test('2. Checkout como invitado', async ({ page }) => {
    // 1. Precondición: sesión cerrada, carrito vacío. Agregar un producto con stock y abrir /checkout.
    const [producto] = await productosConStock(page, 1);
    await agregarProducto(page, producto.nombre);
    await page.goto('/checkout');
    const fila = filaCarrito(page, producto.nombre);
    await expect(fila.getByTestId('product-quantity')).toHaveValue('1');
    await expect(page.getByTestId('cart-total')).toHaveText(dinero(producto.precio));

    // 2. Clic en proceed-1.
    await page.getByTestId('proceed-1').click();
    await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Continue as Guest' })).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('register-link')).toBeVisible();
    await expect(page.getByTestId('forgot-password-link')).toBeVisible();

    // 3. Negativo (primero, en el mismo flujo): guest-email vacío o 'sinarroba' no avanza.
    await page.getByRole('tab', { name: 'Continue as Guest' }).click();
    await page.getByTestId('guest-first-name').fill('Ana');
    await page.getByTestId('guest-last-name').fill('Prueba');
    await page.getByTestId('guest-email').fill('sinarroba');
    await page.getByTestId('guest-submit').click();
    await expect(page.getByTestId('guest-email-error')).toHaveText('Email format is invalid');
    await expect(page.getByTestId('proceed-2-guest')).toBeHidden();
    await page.getByTestId('guest-email').fill('');
    await page.getByTestId('guest-submit').click();
    await expect(page.getByTestId('guest-email-error')).toHaveText('Email is required');
    await expect(page.getByTestId('proceed-2-guest')).toBeHidden();

    // 3. Completar guest-email, nombre y apellido y clic en guest-submit.
    await page.getByTestId('guest-email').fill('invitado.descartable@example.com');
    await page.getByTestId('guest-submit').click();
    await page.getByTestId('proceed-2-guest').click();
    await expect(page.getByTestId('proceed-3')).toBeVisible();

    // 4. Completar dirección y pago, y confirmar.
    await completarDireccionYContinuar(page);
    await page.getByTestId('payment-method').selectOption('cash-on-delivery');
    const confirmacion = await confirmarPago(page);
    await expect(confirmacion).toBeVisible();
  });
});
