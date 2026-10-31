# toolshop-playwright

Reskilling path de QA de Santex. Práctica de Playwright sobre [Toolshop](https://practicesoftwaretesting.com).

## Paso 1: primer test con Playwright

```bash
npm install
npx playwright install chromium
npx playwright codegen https://practicesoftwaretesting.com   # grabar el test
npx playwright test                                           # correrlo
```

- El test grabado va en `tests/`, con una aserción de negocio (por ejemplo, el total del carrito).
- Los 10 casos de regresión van en `docs/casos-regresion.md`.

## Cómo se corre la regresión

### En tu máquina

Requiere Node 18 o superior.

```bash
npm ci
npx playwright install chromium
npx playwright test                    # toda la suite
npx playwright test tests/regresion    # solo los 10 casos de regresión
npx playwright show-report             # ver el resultado
```

### En el pipeline

La suite corre sola en cada pull request a `main` y en cada push a `main` (`.github/workflows/playwright.yml`). Nadie la dispara a mano.

- `main` está protegida: un pull request no se puede mergear si el check `test` falla.
- El job corre en un runner propio (self-hosted), porque Toolshop bloquea los runners de GitHub con una verificación de Cloudflare.
- Si un test falla, el pipeline genera `reporte-de-fallas.md` con `scripts/reporte-de-fallas.mjs`: un reporte por falla en el formato estándar de bugs de Santex, con origen, datos usados e impacto. Lo que el pipeline no puede saber queda como `[FALTA DATO]` para que QA lo complete.
- Dónde verlo: en la corrida de Actions, en el resumen del job y en el artefacto `reporte-de-fallas`. El artefacto `playwright-report` trae el reporte HTML con capturas y traza.

### Datos de prueba

Están versionados en el repositorio, en `tests/regresion/helpers.ts`:

- Cuentas: cada test crea su propia cuenta descartable (`nuevaCuenta`), para no compartir usuarios ni bloquear cuentas.
- Dirección: España, código postal 28001, altura 12, completada con el `postcode-lookup` de Toolshop.
- Productos: se eligen al momento entre los que tienen stock, porque Toolshop es una demo compartida y el stock cambia.

Cada test registra los datos que usó (`registrarDato`), y el reporte de fallas los incluye.

### Reportes de bugs

`docs/reportes-de-bugs.md`: tres bugs de la demo con bugs de Toolshop en el formato estándar, con impacto medido, archivo, clase y commit que los introdujo.
