// spec: specs/regresion.md
// Caso 7 por API: no necesita la interfaz.

import { test, expect } from '@playwright/test';

const API = 'https://api.practicesoftwaretesting.com';
const MARTILLOS = [
  'Claw Hammer with Shock Reduction Grip',
  'Hammer',
  'Claw Hammer',
  'Thor Hammer',
  'Claw Hammer with Fiberglass Handle',
  'Court Hammer',
];

test.describe('Catálogo (API)', () => {
  test('7. Búsqueda por nombre, con y sin resultados', async ({ request }) => {
    // Con resultados
    const res = await request.get(`${API}/products/search`, { params: { q: 'hammer' } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.map((p: { name: string }) => p.name)).toEqual(MARTILLOS);

    // Sin distinguir mayúsculas
    const mayus = await (await request.get(`${API}/products/search`, { params: { q: 'HAMMER' } })).json();
    expect(mayus.data.map((p: { name: string }) => p.name)).toEqual(MARTILLOS);

    // Sin resultados
    const vacio = await (await request.get(`${API}/products/search`, { params: { q: 'zzzzxx' } })).json();
    expect(vacio.data).toHaveLength(0);
  });
});
