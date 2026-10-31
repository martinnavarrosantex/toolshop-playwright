# Reportes de bugs — Toolshop (demo con bugs)

Formato: Estándar de reporte de bugs de QA Santex (v1, octubre 2026).
Reproducidos el 2026-10-22 contra la demo con bugs y comparados con la versión correcta.

---

## [Productos API] GET /products expone el stock exacto y IDs internos a cualquier usuario

### Datos generales
- **Severidad**: Media
- **Prioridad**: [FALTA DATO: la define el PO]
- **Ambiente**: Demo con bugs — https://api-with-bugs.practicesoftwaretesting.com
- **Versión**: carpeta `sprint5-with-bugs` del repo testsmith-io/practice-software-testing, commit `ae7caec` (2026-10-11). [FALTA DATO: no se identificó el commit desplegado en la demo]
- **Navegador / dispositivo**: Chrome 155 en macOS (fetch desde la consola de la página), sin token
- **Ticket relacionado**: `docs/sprints/sprint5-with-bugs.md` #75 · OWASP API3:2023 Broken Object Property Level Authorization
- **Reportado con**: Otra IA: Claude

### Qué pasó
Cualquier persona, sin iniciar sesión, puede ver cuántas unidades exactas hay de cada producto, además de IDs internos de marca, categoría e imagen. Es información de negocio (inventario) que la versión correcta oculta: a los clientes solo les dice si hay stock o no.

### Pasos para reproducir
**Precondiciones**: ninguna. No hace falta usuario ni token.
1. Enviar `GET https://api-with-bugs.practicesoftwaretesting.com/products?page=1` sin header `Authorization`.
2. Mirar los campos de cada producto en `data`.

**Resultado esperado**: cada producto trae `in_stock` (true/false) y no trae `stock` ni IDs internos — así se comporta la versión correcta (sprint5): `GET https://api.practicesoftwaretesting.com/products?page=1`.
**Resultado obtenido**: cada producto trae `"stock": 11` (cantidad exacta), `brand_id`, `category_id` y `product_image_id`, y no trae `in_stock`.
**Frecuencia**: 1 de 1 intentos (reintentar antes de cargarlo)

### Datos de prueba
- **Usuario y rol**: ninguno (request anónima)
- **Valores ingresados**: `GET /products?page=1`, sin body
- **Registros**: por ejemplo Combination Pliers, Pliers y Bolt Cutters, todos con `"stock": 11`
- **De dónde salen los datos**: seed de la demo compartida
- **Contexto**: 2026-10-22 14:24 (UTC-3), sin feature flags

### Origen
- **Cómo se encontró**: testing exploratorio, "BadBoy Tour" sobre la API de productos, comparando la respuesta contra la versión correcta
- **Capa**: API
- **Dónde falla**: `GET /products` → 200 con campos que no deberían exponerse. [FALTA DATO: la respuesta no trae trace id]
- **Desde cuándo**: demo sprint5-with-bugs. Última versión sin el bug: sprint5 (la misma request devuelve solo `in_stock`)

### Impacto
- **Qué flujo afecta**: catálogo de productos (listado y detalle)
- **A quién afecta**: al negocio; los datos los puede leer cualquier persona con internet, sin cuenta
- **Cuántos**: los 26 productos del catálogo de la demo (campo `total` de `GET /products`)
- **Alternativa (workaround)**: no hay; el dato queda expuesto
- **¿Funcionaba antes?**: Sí, en sprint5 el stock está oculto

### Evidencia
- Demo con bugs: `GET /products?page=1` → 200, primer producto con `"stock": 11`, `"brand_id"`, `"category_id"`, `"product_image_id"`
- Versión correcta: `GET https://api.practicesoftwaretesting.com/products?page=1` → 200, primer producto con `"in_stock": true` y sin `stock`

### Fuente del error (nivel 2)
- **Archivo y clase**: `sprint5-with-bugs/API/app/Models/Product.php`
  - Línea 54 › `Product::$hidden`: solo oculta `created_at` y `updated_at`.
  - Línea 55 › `Product::$appends`: no agrega `in_stock`.
- **Commit o PR que lo introdujo**: `d8e53bd` ("initial commit", Roy de Kleijn, 2023-01-16). `git blame` muestra que la línea 54 (`$hidden`) no cambió desde ese commit. En la versión correcta, el arreglo es `6b15b5e` ("in stock is not showing the actual number", 2024-03-14), que agregó `stock` e IDs a `$hidden` y `in_stock` a `$appends` en `sprint5/API/app/Models/Product.php`, pero nunca se aplicó a `sprint5-with-bugs`. La línea 55 la tocó por última vez `fecffa9` (2026-03-29) sin agregar `in_stock`.
- **Cómo lo encontraste**: misma request contra las dos demos → comparar `Product.php` entre sprint5 y sprint5-with-bugs → `git blame -L 54,55` sobre el archivo con bugs y `git log -S"'stock'"` sobre el correcto.
- **Causa**: en sprint5, `$hidden` incluye `brand_id`, `category_id`, `product_image_id` y `stock` (línea 57), y `getInStockAttribute()` devuelve un booleano para usuarios no admin (líneas 87–106). En la versión con bugs esos campos no están ocultos y no existe el atributo `in_stock`.
- **Certeza**: Confirmada: reproducido por API y ubicado en el código de las dos versiones.

```diff
- protected $hidden = ['brand_id', 'category_id', 'product_image_id', 'stock', 'created_at', 'updated_at']; // sprint5
- protected $appends = ['in_stock', 'is_eco_friendly'];
+ protected $hidden = ['created_at', 'updated_at'];   // with-bugs, línea 54
+ protected $appends = ['is_eco_friendly'];           // with-bugs, línea 55
```

---

## [Catálogo] El orden por precio y por nombre funciona al revés

### Datos generales
- **Severidad**: Media
- **Prioridad**: [FALTA DATO: la define el PO]
- **Ambiente**: Demo con bugs — https://with-bugs.practicesoftwaretesting.com
- **Versión**: carpeta `sprint5-with-bugs`, commit `ae7caec` (2026-10-11). [FALTA DATO: no se identificó el commit desplegado en la demo]
- **Navegador / dispositivo**: Chrome 155 en macOS
- **Ticket relacionado**: `docs/sprints/sprint5-with-bugs.md` #2
- **Reportado con**: Otra IA: Claude

### Qué pasó
Cuando el cliente ordena los productos por "Price (Low - High)", los ve del más caro al más barato, y lo mismo pasa con el orden por nombre. Quien busca la opción más barata ve primero las más caras y puede creer que no hay productos económicos.

### Pasos para reproducir
**Precondiciones**: ninguna.
1. Abrir https://with-bugs.practicesoftwaretesting.com/#/category/hand-tools
2. En **Sort**, elegir **Price (Low - High)**.
3. Mirar el orden de los precios.

**Resultado esperado**: precios de menor a mayor — según la etiqueta de la opción y el comportamiento de la versión correcta (sprint5).
**Resultado obtenido**: precios de mayor a menor: $48.41, $38.51, $20.33, $20.14, $18.63, $17.75, $14.24, $14.15, $14.14.
**Frecuencia**: Siempre (1 de 1 intentos en la UI; las opciones del desplegable lo muestran en cada carga)

### Datos de prueba
- **Usuario y rol**: ninguno (visitante)
- **Valores ingresados**: Sort = "Price (Low - High)"
- **Registros**: categoría Hand Tools
- **De dónde salen los datos**: seed de la demo compartida
- **Contexto**: 2026-10-22 14:20 (UTC-3), idioma EN

### Origen
- **Cómo se encontró**: testing exploratorio, "Supporting Actor Tour" (desplegables y orden)
- **Capa**: UI
- **Dónde falla**: Categoría › desplegable **Sort**: la opción "Price (Low - High)" envía `sort=price,desc`
- **Desde cuándo**: demo sprint5-with-bugs. Última versión sin el bug: sprint5

### Impacto
- **Qué flujo afecta**: búsqueda y comparación de productos en el catálogo
- **A quién afecta**: a todos los visitantes que usan el orden, en la home y en las páginas de categoría
- **Cuántos**: 4 de las 6 opciones del desplegable (las de nombre y precio) ordenan al revés de su etiqueta. El desplegable es el mismo en la home y en las páginas de categoría, así que alcanza a los 26 productos del catálogo (campo `total` de `GET /products`, medido el 2026-10-30). [FALTA DATO: cuántas sesiones usan el orden sale de analytics, que la demo no tiene]
- **Alternativa (workaround)**: elegir la opción contraria ("High - Low" para ver de menor a mayor)
- **¿Funcionaba antes?**: Sí, en sprint5

### Evidencia
- Captura de la categoría Hand Tools con "Price (Low - High)" seleccionado y precios descendentes
- Valores del desplegable en la demo con bugs: `name,desc = Name (A - Z)`, `name,asc = Name (Z - A)`, `price,asc = Price (High - Low)`, `price,desc = Price (Low - High)`
- Valores en la versión correcta: `name,asc = A - Z`, `price,desc = Alto - Bajo`, `price,asc = Bajo - Alto`

### Fuente del error (nivel 2)
- **Archivo y clase**:
  - `sprint5-with-bugs/UI/src/app/products/category/category.component.html`, líneas 16–19
  - `sprint5-with-bugs/UI/src/app/products/overview/overview.component.html`, líneas 21–24 (mismo defecto en la home)
- **Commit o PR que lo introdujo**: `d8e53bd` ("initial commit", Roy de Kleijn, 2023-01-16). `git blame` sin opciones marca `085b04e` ("angular update", 2025-06-29), pero ese commit solo cambió la sangría: `git blame -w` (ignorando espacios) muestra que las cuatro opciones cruzadas están así desde `d8e53bd`, en los dos componentes.
- **Cómo lo encontraste**: comparar las opciones del desplegable en las dos demos → buscar `price,asc` en los componentes de las dos versiones → `git blame -w -L 16,19` y `-L 21,24`.
- **Causa**: los `value` de las opciones están cruzados con sus etiquetas. La API ordena bien: el error es solo de la UI.
- **Certeza**: Confirmada: reproducido en la UI y ubicado en el código de las dos versiones.

```diff
- <option value="price,asc">Price (Low - High)</option>   <!-- sprint5 -->
+ <option value="price,asc">Price (High - Low)</option>   <!-- with-bugs, línea 18 -->
+ <option value="price,desc">Price (Low - High)</option>  <!-- with-bugs, línea 19 -->
```

---

## [Catálogo] El filtro de precio ignora el precio máximo

### Datos generales
- **Severidad**: Media
- **Prioridad**: [FALTA DATO: la define el PO]
- **Ambiente**: Demo con bugs — https://with-bugs.practicesoftwaretesting.com
- **Versión**: carpeta `sprint5-with-bugs`, commit `ae7caec` (2026-10-11). [FALTA DATO: no se identificó el commit desplegado en la demo]
- **Navegador / dispositivo**: Chrome 155 en macOS
- **Ticket relacionado**: `docs/sprints/sprint5-with-bugs.md` #27
- **Reportado con**: Otra IA: Claude

### Qué pasó
El filtro de rango de precio de la home muestra un máximo ($100 por defecto), pero ese máximo nunca se envía al servidor, así que aparecen productos más caros. Un cliente que limita su presupuesto ve productos que no puede pagar.

### Pasos para reproducir
**Precondiciones**: ninguna.
1. Abrir https://with-bugs.practicesoftwaretesting.com/#/ con las herramientas de red del navegador abiertas.
2. Mirar la request a `/products` que hace la home (el filtro de precio está en 1–100 por defecto).
3. Revisar los precios de los productos devueltos.

**Resultado esperado**: la request envía `between=price,1,100` y no aparecen productos de más de $100 — así lo hace la versión correcta (sprint5).
**Resultado obtenido**: la request envía `between=price,1` (sin máximo) y aparecen 3 productos de más de $100: Random Orbit Sander ($100.79), Cordless Drill 18V ($119.24) y Cordless Drill 20V ($125.23).
**Frecuencia**: Siempre (en cada carga de la home y en cada cambio de filtro, porque todas las llamadas usan el mismo método)

### Datos de prueba
- **Usuario y rol**: ninguno (visitante)
- **Valores ingresados**: rango de precio por defecto (1–100)
- **Registros**: los 3 productos de más de $100 nombrados arriba
- **De dónde salen los datos**: seed de la demo compartida
- **Contexto**: 2026-10-22 14:25 (UTC-3)

### Origen
- **Cómo se encontró**: testing exploratorio, "FedEx Tour" (seguir el dato del filtro hasta la request)
- **Capa**: UI
- **Dónde falla**: Home › filtro de precio → `GET /products?between=price,1&page=1` (falta el máximo)
- **Desde cuándo**: demo sprint5-with-bugs. Última versión sin el bug: sprint5

### Impacto
- **Qué flujo afecta**: filtrado del catálogo por presupuesto
- **A quién afecta**: a todos los visitantes que usan el filtro de precio
- **Cuántos**: en la demo, 26 productos con el filtro por defecto contra 23 si se respetara el máximo (`between=price,1` contra `between=price,1,100`, campo `total`)
- **Alternativa (workaround)**: ordenar por precio y descartar a mano los que superan el máximo
- **¿Funcionaba antes?**: Sí, en sprint5

### Evidencia
- Request capturada: `GET https://api-with-bugs.practicesoftwaretesting.com/products?between=price,1&page=1`
- Misma API con el máximo: `GET /products?between=price,1,100` → 23 productos, ninguno de más de $100

### Fuente del error (nivel 2)
- **Archivo y clase**: `sprint5-with-bugs/UI/src/app/_services/product.service.ts`
  - Línea 35 › `ProductService.getProductsNew`: arma `between` solo con el mínimo, aunque recibe `maxPrice`.
- **Commit o PR que lo introdujo**: `d8e53bd` ("initial commit", Roy de Kleijn, 2023-01-16). `git blame -L 33,37` muestra que la línea 35 no cambió desde ese commit.
- **Cómo lo encontraste**: capturar la request de la home → buscar `between` en el servicio de productos de las dos versiones → `git blame` sobre la línea.
- **Causa**: el parámetro se arma sin `maxPrice`. La API filtra bien cuando recibe los dos valores.
- **Certeza**: Confirmada: reproducido en la red del navegador y ubicado en el código de las dos versiones.

```diff
- if (minPrice && maxPrice) criteria['between'] = `price,${minPrice},${maxPrice}`;  // sprint5
+ params = params.set('between', `price,${minPrice}`);                              // with-bugs, línea 35
```
