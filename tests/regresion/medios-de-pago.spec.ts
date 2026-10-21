// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect, Page } from '@playwright/test';
import {
  agregarProducto,
  completarDireccion,
  confirmarPago,
  iniciarSesion,
  registrarCuenta,
} from './helpers';

async function llegarAPago(page: Page) {
  await agregarProducto(page, 'Hammer');
  await page.goto('/checkout');
  await page.getByTestId('proceed-1').click();
  await page.getByTestId('proceed-2').click();
  await completarDireccion(page);
  await page.getByTestId('proceed-3').click();
  await expect(page.getByTestId('payment-method')).toBeVisible();
}

test.describe('Checkout', () => {
  test('3. Checkout con cada medio de pago', async ({ page }) => {
    // 1. Precondición: usuario logueado. Opciones reales del desplegable de pago.
    const cuenta = await registrarCuenta(page, 'pagos');
    await iniciarSesion(page, cuenta);
    await agregarProducto(page, 'Hammer');
    await page.goto('/checkout');
    await page.getByTestId('proceed-1').click();
    await page.getByTestId('proceed-2').click();
    await completarDireccion(page);
    await page.getByTestId('proceed-3').click();
    const metodo = page.getByTestId('payment-method');
    await expect(metodo.getByRole('option')).toHaveText([
      'Choose your payment method',
      'Bank Transfer',
      'Cash on Delivery',
      'Credit Card',
      'Buy Now Pay Later',
      'Gift Card',
    ]);

    // 2. Enviar sin completar los campos de la opción elegida (validación por campo).
    await metodo.selectOption('bank-transfer');
    await expect(page.getByTestId('finish')).toBeDisabled();
    await page.getByTestId('bank_name').fill('123');
    await page.getByTestId('account_name').fill('@@');
    await page.getByTestId('account_number').fill('ES1234567890');
    await expect(page.getByText('Bank name can only contain letters and spaces.')).toBeVisible();
    await expect(
      page.getByText('Account name can contain letters, numbers, spaces, periods, apostrophes, and hyphens.')
    ).toBeVisible();
    await expect(page.getByText('Account number must be numeric.')).toBeVisible();
    await expect(page.getByTestId('finish')).toBeDisabled();

    // 3. Datos válidos: Bank Transfer (Banco Test / Ana Prueba / cuenta numérica).
    await page.getByTestId('bank_name').fill('Banco Test');
    await page.getByTestId('account_name').fill('Ana Prueba');
    await page.getByTestId('account_number').fill('1234567890');
    await confirmarPago(page);

    // Cash on Delivery
    await llegarAPago(page);
    await metodo.selectOption('cash-on-delivery');
    await confirmarPago(page);

    // 4. Credit Card: vencimiento pasado / número inválido se rechazan; luego datos válidos.
    await llegarAPago(page);
    await metodo.selectOption('credit-card');
    await page.getByTestId('credit_card_number').fill('1234');
    await page.getByTestId('expiration_date').fill('01/2020');
    await page.getByTestId('cvv').fill('12');
    await page.getByTestId('card_holder_name').fill('Ana Prueba');
    await expect(page.getByText('Invalid card number format.')).toBeVisible();
    await expect(page.getByText('Expiration date must be in the future.')).toBeVisible();
    await expect(page.getByText('CVV must be 3 or 4 digits.')).toBeVisible();
    await expect(page.getByTestId('finish')).toBeDisabled();
    await page.getByTestId('credit_card_number').fill('4111-1111-1111-1111');
    await page.getByTestId('expiration_date').fill('12/2030');
    await page.getByTestId('cvv').fill('123');
    await confirmarPago(page);

    // Buy Now Pay Later
    await llegarAPago(page);
    await metodo.selectOption('buy-now-pay-later');
    await expect(page.getByTestId('finish')).toBeDisabled();
    await page.getByTestId('monthly_installments').selectOption('6');
    await confirmarPago(page);

    // Gift Card
    await llegarAPago(page);
    await metodo.selectOption('gift-card');
    await page.getByTestId('gift_card_number').fill('@@');
    await page.getByTestId('validation_code').fill('@@');
    await expect(
      page.getByText('Please enter a valid gift card number: exactly 16 letters and/or digits.')
    ).toBeVisible();
    await expect(
      page.getByText('Please enter a valid validation code: exactly 4 letters and/or digits.')
    ).toBeVisible();
    await expect(page.getByTestId('finish')).toBeDisabled();
    await page.getByTestId('gift_card_number').fill('ABCD1234EFGH5678');
    await page.getByTestId('validation_code').fill('AB12');
    await confirmarPago(page);
  });
});
