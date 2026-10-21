// spec: specs/regresion.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { registrarCuenta } from './helpers';

test.describe('Autenticación', () => {
  test('9. Login válido, inválido y bloqueo tras intentos fallidos', async ({ page }) => {
    // 1. Precondición: cuenta descartable propia. Ir a /auth/login.
    const cuenta = await registrarCuenta(page, 'login');
    await page.goto('/auth/login');
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();

    // 2. Login válido con la cuenta descartable.
    await page.getByTestId('email').fill(cuenta.email);
    await page.getByTestId('password').fill(cuenta.password);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByTestId('nav-menu')).toContainText('Ana Prueba');

    // 3. Cerrar sesión y probar login inválido con un email inexistente.
    await page.getByTestId('nav-menu').click();
    await page.getByTestId('nav-sign-out').click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.getByTestId('email').fill('nadie.descartable@example.com');
    await page.getByTestId('password').fill('Incorrecta#123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);

    // 4. Probar campos vacíos y un email con formato inválido.
    await page.getByTestId('email').fill('');
    await page.getByTestId('password').fill('');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('email-error')).toHaveText('Email is required');
    await expect(page.getByTestId('password-error')).toHaveText('Password is required');
    await page.getByTestId('email').fill('formato-invalido');
    await expect(page.getByTestId('email-error')).toHaveText('Email format is invalid');

    // 5. Bloqueo: solo con la cuenta descartable propia, contraseña errónea repetida.
    // Observado: el bloqueo aparece entre el intento 4 y el 5 (nunca después de 5 fallos).
    await page.getByTestId('email').fill(cuenta.email);
    await page.getByTestId('password').fill('Incorrecta#123');
    const mensajeBloqueo = 'Account locked, too many failed attempts. Please contact the administrator.';
    let intentos = 0;
    while (intentos < 5) {
      const respuesta = page.waitForResponse((r) => r.url().includes('/users/login'));
      await page.getByTestId('login-submit').click();
      const estado = (await respuesta).status();
      intentos++;
      if (estado === 423) break; // 423 = cuenta bloqueada
      await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    }
    await expect(page.getByTestId('login-error')).toHaveText(mensajeBloqueo);
    expect(intentos).toBeLessThanOrEqual(5);

    // El login válido también se rechaza mientras dure el bloqueo.
    await page.getByTestId('password').fill(cuenta.password);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText(mensajeBloqueo);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
