import { expect, Locator, Page } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';

export interface Cuenta {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export function nuevaCuenta(prefijo = 'ana'): Cuenta {
  const sufijo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    email: `${prefijo}.${sufijo}@example.com`,
    password: 'Prueba#2026x',
    nombre: 'Ana',
    apellido: 'Prueba',
  };
}

export async function completarRegistro(page: Page, cuenta: Cuenta) {
  await page.getByTestId('first-name').fill(cuenta.nombre);
  await page.getByTestId('last-name').fill(cuenta.apellido);
  await page.getByTestId('dob').fill('1990-05-15');
  await page.getByTestId('country').selectOption('Spain');
  await page.getByTestId('postal_code').fill('28001');
  await page.getByTestId('house_number').fill('12');
  await page.getByTestId('street').fill('Calle Test');
  await page.getByTestId('city').fill('Ciudad');
  await page.getByTestId('state').fill('Estado');
  await page.getByTestId('phone').fill('600123456');
  await page.getByTestId('email').fill(cuenta.email);
  await page.getByTestId('password').fill(cuenta.password);
}

/** Crea una cuenta descartable propia desde la UI de registro. */
export async function registrarCuenta(page: Page, prefijo = 'ana'): Promise<Cuenta> {
  const cuenta = nuevaCuenta(prefijo);
  await page.goto('/auth/register');
  await completarRegistro(page, cuenta);
  await page.getByTestId('register-submit').click();
  await expect(page).toHaveURL(/\/auth\/login/);
  return cuenta;
}

export async function iniciarSesion(page: Page, cuenta: Cuenta) {
  const login = new LoginPage(page);
  await login.open();
  await login.login(cuenta.email, cuenta.password);
  await expect(page).toHaveURL(/\/account/);
}

/** Busca un producto por nombre en la home y abre su ficha (por nombre accesible). */
export async function abrirProducto(page: Page, nombre: string) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search' }).fill(nombre);
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('heading', { name: nombre, level: 5, exact: true }).click();
  await expect(page.getByRole('heading', { name: nombre, level: 1, exact: true })).toBeVisible();
}

/** Abre un producto por nombre y lo agrega al carrito con la cantidad indicada. */
export async function agregarProducto(page: Page, nombre: string, cantidad = 1) {
  await abrirProducto(page, nombre);
  const contador = page.getByTestId('cart-quantity');
  const previas = (await contador.count()) ? Number(await contador.innerText()) : 0;
  if (cantidad > 1) {
    await page.getByRole('spinbutton', { name: 'Quantity' }).fill(String(cantidad));
  }
  await page.getByTestId('add-to-cart').click();
  await expect(contador).toHaveText(String(previas + cantidad));
}

/** Fila de la tabla del carrito para un producto, por nombre accesible. */
export function filaCarrito(page: Page, nombre: string): Locator {
  return page
    .getByRole('row')
    .filter({ has: page.getByTestId('product-title').getByText(nombre, { exact: true }) });
}

export async function completarDireccion(page: Page) {
  await page.getByTestId('country').selectOption('ES');
  await page.getByTestId('postal_code').fill('28001');
  await page.getByTestId('house_number').fill('12');
  await page.getByTestId('street').fill('Calle Test');
  await page.getByTestId('city').fill('Ciudad');
  await page.getByTestId('state').fill('Estado');
}

/** Primer clic de "Check payment" y segundo clic "Confirm". Devuelve el texto del pedido. */
export async function confirmarPago(page: Page) {
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('payment-success-message')).toHaveText('Payment was successful');
  await expect(page.getByTestId('finish')).toHaveText('Confirm');
  await page.getByTestId('finish').click();
  const confirmacion = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
  await expect(confirmacion).toBeVisible();
  return confirmacion;
}
