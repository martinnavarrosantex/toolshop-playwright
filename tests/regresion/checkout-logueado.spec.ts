// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  agregarProducto,
  completarDireccion,
  confirmarPago,
  filaCarrito,
  iniciarSesion,
  registrarCuenta,
} from './helpers';

test.describe('Checkout', () => {
  // Bug de Toolshop: después de comprar, el carrito sigue mostrando el producto
  // (la factura se genera, pero cart-quantity queda en 1). Cuando lo corrijan, este test pasa a fallar.
  test.fail('1. Checkout completo con usuario logueado', async ({ page }) => {
    // 1. Precondición: cuenta propia registrada, carrito vacío. Iniciar sesión.
    const cuenta = await registrarCuenta(page, 'checkout');
    await iniciarSesion(page, cuenta);
    await expect(page.getByTestId('nav-menu')).toContainText('Ana Prueba');

    // 2. En la home abrir 'Hammer' y hacer clic en Add to cart.
    await agregarProducto(page, 'Hammer');
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');

    // 3. Abrir /checkout y revisar la tabla. Clic en proceed-1.
    await page.goto('/checkout');
    const hammer = filaCarrito(page, 'Hammer');
    await expect(hammer.getByTestId('product-quantity')).toHaveValue('1');
    await expect(hammer.getByTestId('product-price')).toHaveText('$12.58');
    await expect(hammer.getByTestId('line-price')).toHaveText('$12.58');
    await expect(page.getByTestId('cart-total')).toHaveText('$12.58');
    await page.getByTestId('proceed-1').click();
    // El paso Sign in ya está resuelto por la sesión (proceed-2 solo confirma).
    await expect(page.getByText('you are already logged in')).toBeVisible();
    await page.getByTestId('proceed-2').click();

    // 4. Completar dirección y clic en proceed-3.
    await completarDireccion(page);
    await page.getByTestId('proceed-3').click();
    await expect(page.getByTestId('payment-method')).toBeVisible();

    // 5. Elegir un medio de pago, completar sus datos y confirmar.
    await page.getByTestId('payment-method').selectOption('bank-transfer');
    await page.getByTestId('bank_name').fill('Banco Test');
    await page.getByTestId('account_name').fill('Ana Prueba');
    await page.getByTestId('account_number').fill('1234567890');
    const confirmacion = await confirmarPago(page);
    const factura = (await confirmacion.innerText()).match(/INV-\d+/)![0];

    // El pedido figura en /account/invoices y el carrito queda vacío.
    await page.goto('/account/invoices');
    await expect(page.getByRole('cell', { name: factura })).toBeVisible();
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  });
});
