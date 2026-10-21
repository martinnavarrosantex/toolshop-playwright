// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { completarRegistro, iniciarSesion, nuevaCuenta } from './helpers';

test.describe('Registro', () => {
  // Bug de Toolshop: el registro no avisa que el email no tiene formato válido (el login sí).
  // Cuando lo corrijan, este test pasa a fallar.
  test.fail('10. Registro de usuario nuevo con validación de campos', async ({ page }) => {
    const cuenta = nuevaCuenta('ana');

    // 1. Ir a /auth/register y clic en register-submit sin completar nada.
    await page.goto('/auth/register');
    await page.getByTestId('register-submit').click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Date of Birth is required')).toBeVisible();
    await expect(page.getByText('Please enter a valid date in YYYY-MM-DD format.')).toBeVisible();
    await expect(page.getByText('Country is required')).toBeVisible();
    await expect(page.getByText('Postcode is required')).toBeVisible();
    await expect(page.getByText('House number is required')).toBeVisible();
    await expect(page.getByText('Street is required')).toBeVisible();
    await expect(page.getByText('City is required')).toBeVisible();
    await expect(page.getByText('State is required')).toBeVisible();
    await expect(page.getByText('Phone is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);

    // 2. Probar password 'abc' y con caracteres inválidos.
    await page.getByTestId('password').fill('abc');
    await expect(page.getByText('Password must be minimal 6 characters long.')).toBeVisible();
    await expect(page.getByText('Password can not include invalid characters.')).toBeVisible();

    // 3. Probar email sin formato válido, fecha de nacimiento fuera de formato y teléfono con letras.
    await page.getByTestId('email').fill('sinarroba');
    await expect(page.getByText('Email format is invalid')).toBeVisible();
    await page.getByTestId('dob').fill('15/05/1990');
    await expect(page.getByText('Please enter a valid date in YYYY-MM-DD format.')).toBeVisible();
    await page.getByTestId('phone').fill('abc123');
    await page.getByTestId('phone').blur();
    await expect(page.getByTestId('register-submit')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);

    // 4. Completar datos válidos y clic en Register.
    await completarRegistro(page, cuenta);
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL(/\/auth\/login/);

    // 5. Iniciar sesión con la cuenta recién creada.
    await iniciarSesion(page, cuenta);
    await expect(page.getByTestId('nav-menu')).toContainText('Ana Prueba');

    // 6. Negativo: registrar de nuevo con el mismo email.
    await page.goto('/auth/register');
    await completarRegistro(page, cuenta);
    await page.getByTestId('register-submit').click();
    await expect(page.getByTestId('register-error')).toHaveText(
      'A customer with this email address already exists.'
    );
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
