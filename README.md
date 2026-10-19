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
