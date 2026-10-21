// spec: specs/regresion.md
// Caso 8 por API: no necesita la interfaz.

import { test, expect } from '@playwright/test';

const API = 'https://api.practicesoftwaretesting.com';
const nombres = (body: { data: { name: string }[] }) => body.data.map((p) => p.name);
const precios = (body: { data: { price: number }[] }) => body.data.map((p) => p.price);

test.describe('Catálogo (API)', () => {
  test('8. Filtros por categoría y marca, y orden por precio', async ({ request }) => {
    // Los IDs cambian entre deploys: se buscan por nombre.
    const categorias = await (await request.get(`${API}/categories`)).json();
    const marcas = await (await request.get(`${API}/brands`)).json();
    const pinzas = categorias.find((c: { name: string }) => c.name === 'Pliers').id;
    const forgeFlex = marcas.find((m: { name: string }) => m.name === 'ForgeFlex Tools').id;

    // Filtro por categoría
    const porCategoria = await (await request.get(`${API}/products`, { params: { by_category: pinzas } })).json();
    expect(nombres(porCategoria).sort()).toEqual(
      ['Bolt Cutters', 'Combination Pliers', 'Long Nose Pliers', 'Pliers', 'Slip Joint Pliers'].sort()
    );

    // Categoría y marca
    const porMarca = await (
      await request.get(`${API}/products`, { params: { by_category: pinzas, by_brand: forgeFlex } })
    ).json();
    expect(nombres(porMarca).sort()).toEqual(['Combination Pliers', 'Pliers']);

    // Orden por precio, ascendente y descendente
    const asc = precios(await (await request.get(`${API}/products`, { params: { sort: 'price,asc' } })).json());
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = precios(await (await request.get(`${API}/products`, { params: { sort: 'price,desc' } })).json());
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });
});
