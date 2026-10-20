# Casos de regresión

Los diez casos de la regresión de Toolshop que más tiempo consumen si se prueban a mano.

| # | Caso | Módulo | Por qué consume tiempo |
|---|------|--------|------------------------|
| 1 | Checkout completo con usuario logueado | Checkout | Carrito, login, dirección y pago: muchos pasos y datos |
| 2 | Checkout como invitado | Checkout | Formulario de invitado y dirección completa |
| 3 | Checkout con cada medio de pago | Checkout | Cada medio pide campos distintos y hay que repetir el flujo |
| 4 | Total del carrito con varios productos y cantidades | Carrito | Hay que calcular a mano precio por cantidad y la suma |
| 5 | Cambiar cantidad y quitar productos recalcula el total | Carrito | Varias combinaciones y verificar cada recálculo |
| 6 | Producto sin stock no se puede agregar al carrito | Producto | Hay que encontrar productos agotados y probar cada uno |
| 7 | Búsqueda por nombre, con y sin resultados | Catálogo | Varios términos y verificar cada resultado |
| 8 | Filtros por categoría y marca, y orden por precio | Catálogo | Muchas combinaciones de filtros y verificar el orden |
| 9 | Login válido, inválido y bloqueo tras intentos fallidos | Autenticación | Repetir intentos hasta que se bloquea la cuenta |
| 10 | Registro de usuario nuevo con validación de campos | Registro | Formulario largo, datos únicos y un caso por validación |
