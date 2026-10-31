import { expect, Locator, Page, test } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';

const API = 'https://api.practicesoftwaretesting.com';

export interface Producto {
  nombre: string;
  precio: number;
}

/**
 * Deja asentado qué datos usó el test. Si falla, el pipeline los copia en "Datos de prueba" del reporte.
 */
export function registrarDato(descripcion: string) {
  test.info().annotations.push({ type: 'dato', description: descripcion });
}

/** Importe con el formato que muestra Toolshop, por ejemplo $12.58. */
export const dinero = (importe: number) => `$${importe.toFixed(2)}`;

type ProductoApi = { name: string; price: number; in_stock: boolean; is_rental: boolean; description?: string };

async function catalogo(page: Page): Promise<ProductoApi[]> {
  const productos: ProductoApi[] = [];
  for (let pagina = 1; pagina <= 10; pagina++) {
    const res = await page.request.get(`${API}/products`, { params: { page: pagina } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    productos.push(...body.data);
    if (pagina >= body.last_page) break;
  }
  // Solo nombres únicos, para que la búsqueda y la fila del carrito no sean ambiguas.
  return productos.filter((p) => productos.filter((q) => q.name === p.name).length === 1);
}

/**
 * Toolshop es una demo compartida: otros usuarios compran y el stock cambia durante el día.
 * Por eso los tests eligen en el momento productos con stock y sin límite de "uno por cliente".
 */
export async function productosConStock(page: Page, cantidad: number): Promise<Producto[]> {
  const elegidos = (await catalogo(page))
    .filter((p) => p.in_stock && !p.is_rental && !/per customer/i.test(p.description ?? ''))
    .slice(0, cantidad)
    .map((p) => ({ nombre: p.name, precio: p.price }));
  expect(elegidos, `Toolshop tiene ${cantidad} productos con stock`).toHaveLength(cantidad);
  registrarDato(`Productos con stock elegidos: ${elegidos.map((p) => `${p.nombre} (${dinero(p.precio)})`).join(', ')}`);
  return elegidos;
}

/** Un producto agotado en este momento, si hay alguno. */
export async function productoSinStock(page: Page): Promise<Producto | undefined> {
  const p = (await catalogo(page)).find((x) => !x.in_stock && !x.is_rental);
  if (p) registrarDato(`Producto sin stock: ${p.name}`);
  return p && { nombre: p.name, precio: p.price };
}

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

/**
 * Dirección de prueba: la que devuelve el postcode-lookup de Toolshop para 28001 / 12.
 * Toolshop valida la factura contra esos datos (regla AddressMatchesCountry), así que la
 * cuenta y el checkout usan exactamente la misma dirección.
 */
export async function direccionDePrueba(page: Page) {
  const res = await page.request.get('https://api.practicesoftwaretesting.com/postcode-lookup', {
    params: { country: 'ES', postcode: '28001', house_number: '12' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as { street: string; city: string; state: string };
}

export async function completarRegistro(page: Page, cuenta: Cuenta) {
  await page.getByTestId('first-name').fill(cuenta.nombre);
  await page.getByTestId('last-name').fill(cuenta.apellido);
  await page.getByTestId('dob').fill('1990-05-15');
  await page.getByTestId('country').selectOption('Spain');
  await page.getByTestId('postal_code').fill('28001');
  await page.getByTestId('house_number').fill('12');
  const direccion = await direccionDePrueba(page);
  await page.getByTestId('street').fill(direccion.street);
  await page.getByTestId('city').fill(direccion.city);
  await page.getByTestId('state').fill(direccion.state);
  await page.getByTestId('phone').fill('600123456');
  await page.getByTestId('email').fill(cuenta.email);
  await page.getByTestId('password').fill(cuenta.password);
}

/** Crea una cuenta descartable propia desde la UI de registro. */
export async function registrarCuenta(page: Page, prefijo = 'ana'): Promise<Cuenta> {
  const cuenta = nuevaCuenta(prefijo);
  registrarDato(`Cuenta nueva: ${cuenta.email}`);
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

/**
 * Completa la dirección de facturación y pasa al paso de pago.
 * Con usuario logueado, Toolshop precarga la dirección de la cuenta (que no guarda la altura) y esa
 * precarga puede llegar tarde y vaciar la altura. Por eso carga, avanza y verifica que se llegó al
 * paso de pago en un mismo reintento.
 */
export async function completarDireccionYContinuar(page: Page) {
  const direccion = await direccionDePrueba(page);
  await page.getByTestId('country').selectOption('ES');
  await expect(async () => {
    await page.getByTestId('postal_code').fill('28001');
    await page.getByTestId('house_number').fill('12');
    await page.getByTestId('street').fill(direccion.street);
    await page.getByTestId('city').fill(direccion.city);
    await page.getByTestId('state').fill(direccion.state);
    await page.getByTestId('proceed-3').click({ timeout: 2000 });
    await expect(page.getByTestId('payment-method')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20000 });
}

/** Primer clic de "Check payment" y segundo clic "Confirm". Devuelve el texto del pedido. */
export async function confirmarPago(page: Page) {
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('payment-success-message')).toHaveText('Payment was successful');
  await expect(page.getByTestId('finish')).toHaveText('Confirm');
  await page.getByTestId('finish').click();
  const confirmacion = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
  await expect(confirmacion).toBeVisible();
  // Después de confirmar, la app vacía el carrito (DELETE /carts). Se espera a que quede vacío
  // antes de seguir: navegar antes cancela esa request y el próximo checkout arrastra el carrito.
  await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  return confirmacion;
}
