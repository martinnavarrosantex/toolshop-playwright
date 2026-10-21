# Plan de regresión - Toolshop

## Application Overview

Plan de regresión de 10 casos para Toolshop (https://practicesoftwaretesting.com, v5.0). Cubre checkout, carrito, producto sin stock, búsqueda, filtros/orden, login y registro. Observado en la app: pasos del checkout CART > SIGN IN > BILLING ADDRESS > PAYMENT; "Continue as Guest" disponible; "Invalid email or password" ante credenciales inválidas; "There are no products found." sin resultados; "Searched for: hammer". Los precios y el catálogo pueden cambiar, así que verificar los valores esperados contra la app al ejecutar. Los medios de pago del caso 3 y el mensaje de bloqueo del caso 9 no se ejecutaron durante la exploración y deben confirmarse en la primera corrida. Selectores útiles: data-test add-to-cart, out-of-stock, proceed-1, proceed-3, finish, cart-total, product-quantity, line-price, guest-email, guest-submit, email, password, login-submit, login-error, register-submit, sort, search-caption, no-results.

## Test Scenarios

### 1. Checkout

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1. Checkout completo con usuario logueado

**File:** `tests/checkout/checkout-logueado.spec.ts`

**Steps:**
  1. Precondición: cuenta de prueba propia ya registrada (ver caso 10), carrito vacío. Ir a /auth/login e iniciar sesión con esa cuenta.
    - expect: Se redirige a /account y el menú muestra el nombre del usuario.
  2. En la home abrir el producto 'Hammer' ($12.58) y hacer clic en Add to cart.
    - expect: El contador del carrito pasa a 1.
  3. Abrir /checkout y revisar la tabla: Hammer, cantidad 1, precio $12.58, total $12.58. Clic en proceed-1.
    - expect: Se pasa al paso de dirección de facturación; el paso Sign in ya está resuelto por la sesión.
  4. Completar dirección (street, city, state, country, postal code) y clic en proceed-3.
    - expect: Se muestra el paso Payment.
  5. Elegir un medio de pago, completar sus datos y clic en Confirm.
    - expect: Mensaje de pago exitoso, se muestra finish; al confirmar aparece un número de factura/pedido y el carrito queda vacío.
    - expect: El pedido figura en /account/invoices.

#### 1.2. 2. Checkout como invitado

**File:** `tests/checkout/checkout-invitado.spec.ts`

**Steps:**
  1. Precondición: sesión cerrada, carrito vacío. Agregar 'Hammer' al carrito y abrir /checkout.
    - expect: La tabla muestra Hammer x1, total $12.58.
  2. Clic en proceed-1.
    - expect: Aparecen las pestañas Sign in / Continue as Guest, con login, register-link, forgot-password-link.
  3. Abrir Continue as Guest. Completar guest-email (invitado.descartable@example.com), guest-first-name (Ana), guest-last-name (Prueba) y clic en guest-submit.
    - expect: Se habilita el paso de dirección de facturación.
  4. Completar dirección y pago, y confirmar.
    - expect: Pedido confirmado con mensaje de éxito.
  5. Negativo: repetir con guest-email vacío o 'sinarroba'.
    - expect: Mensaje de validación y no se avanza de paso.

#### 1.3. 3. Checkout con cada medio de pago

**File:** `tests/checkout/medios-de-pago.spec.ts`

**Steps:**
  1. Precondición: usuario logueado y un producto en el carrito. Llegar al paso Payment. Repetir el flujo una vez por cada opción del desplegable de pago (esperadas: Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later, Gift Card; confirmar la lista real).
    - expect: Cada opción muestra sus campos propios.
  2. Enviar sin completar los campos de la opción elegida.
    - expect: Errores de validación por campo y no se confirma el pedido.
  3. Completar datos válidos. Ejemplo: Bank Transfer con nombre 'Ana Prueba', cuenta 'ES1234567890' y banco 'Banco Test'; tarjeta con número 4111-1111-1111-1111, vencimiento futuro MM/YYYY, CVV 123 y titular.
    - expect: Mensaje 'Payment was successful' y pedido confirmado para cada medio.
  4. Credit Card con vencimiento pasado o número inválido.
    - expect: Se rechaza con mensaje de validación.

### 2. Carrito

**Seed:** `tests/seed.spec.ts`

#### 2.1. 4. Total del carrito con varios productos y cantidades

**File:** `tests/carrito/total-carrito.spec.ts`

**Steps:**
  1. Precondición: carrito vacío. Agregar Hammer ($12.58) x1, Pliers ($12.01) x1 y Slip Joint Pliers ($9.17) x1. Para cantidad 3 de uno, usar el campo cantidad de la ficha antes de agregar.
    - expect: El contador del carrito refleja el total de unidades.
  2. Abrir /checkout y revisar product-title, product-quantity, product-price, line-price y cart-total.
    - expect: line-price = precio x cantidad por fila. Ejemplo con Hammer x3, Pliers x1, Slip Joint x2: 37.74 + 12.01 + 18.34 = $68.09.
    - expect: cart-total es la suma de las filas con 2 decimales.

#### 2.2. 5. Cambiar cantidad y quitar productos recalcula el total

**File:** `tests/carrito/editar-carrito.spec.ts`

**Steps:**
  1. Precondición: carrito con Hammer x1 ($12.58) y Pliers x1 ($12.01), total $24.59.
    - expect: Total inicial $24.59.
  2. Cambiar product-quantity de Hammer a 4 y salir del campo.
    - expect: line-price de Hammer $50.32, total $62.33.
  3. Negativo: poner cantidad 0 o un valor negativo.
    - expect: No se admite un valor inválido; la cantidad vuelve a un valor válido o se quita la línea, y el total sigue siendo coherente.
  4. Quitar la fila de Pliers con el ícono de eliminar.
    - expect: La fila desaparece, total $50.32.
  5. Quitar el último producto.
    - expect: Se muestra mensaje de carrito vacío; el contador desaparece o queda en 0.

### 3. Producto

**Seed:** `tests/seed.spec.ts`

#### 3.1. 6. Producto sin stock no se puede agregar al carrito

**File:** `tests/producto/sin-stock.spec.ts`

**Steps:**
  1. En la home localizar 'Long Nose Pliers' ($14.24), con la etiqueta 'Out of stock' en el listado. Abrirlo (/product/01M5DRPQ1T9DSEH2V1TCG9C2B9).
    - expect: La ficha muestra data-test out-of-stock con el texto 'Out of stock'.
  2. Verificar el botón Add to cart.
    - expect: El botón está deshabilitado y al hacer clic no cambia el contador del carrito.
  3. Abrir /checkout.
    - expect: El carrito no contiene el producto.
  4. Contraste: abrir Hammer.
    - expect: Hammer no muestra Out of stock y su Add to cart está habilitado.

### 4. Catálogo

**Seed:** `tests/seed.spec.ts`

#### 4.1. 7. Búsqueda por nombre, con y sin resultados

**File:** `tests/catalogo/busqueda.spec.ts`

**Steps:**
  1. En la home escribir 'hammer' en Search y clic en Search.
    - expect: search-caption muestra 'Searched for: hammer'.
    - expect: Resultados observados: Claw Hammer with Shock Reduction Grip, Hammer, Claw Hammer, Thor Hammer, Claw Hammer with Fiberglass Handle, Court Hammer.
  2. Buscar 'zzzzxx'.
    - expect: Se muestra 'There are no products found.' y no hay tarjetas.
  3. Buscar 'HAMMER' en mayúsculas y luego un término con espacios al final.
    - expect: Comportamiento coherente con la búsqueda inicial (sin distinción de mayúsculas).
  4. Clic en el botón X.
    - expect: Se limpia el campo y vuelve el listado completo.

#### 4.2. 8. Filtros por categoría y marca, y orden por precio

**File:** `tests/catalogo/filtros-orden.spec.ts`

**Steps:**
  1. En la home elegir en sort 'Price (Low - High)'.
    - expect: Los precios de la página van de menor a mayor (observado: $3.55, $3.95, $4.65 ... $9.17).
  2. Elegir 'Price (High - Low)'.
    - expect: Orden descendente (observado: $89.55, $86.71, ... $46.50).
  3. Marcar la categoría Pliers.
    - expect: Resultados observados: Bolt Cutters, Long Nose Pliers, Combination Pliers, Pliers, Slip Joint Pliers.
  4. Marcar además la marca ForgeFlex Tools.
    - expect: Se reduce a Combination Pliers y Pliers.
  5. Desmarcar los filtros. Probar también Name (A-Z) y Name (Z-A).
    - expect: Vuelve el listado completo y el orden por nombre es correcto.
  6. Combinar categoría con una búsqueda sin coincidencias.
    - expect: Se muestra 'There are no products found.'.

### 5. Autenticación

**Seed:** `tests/seed.spec.ts`

#### 5.1. 9. Login válido, inválido y bloqueo tras intentos fallidos

**File:** `tests/auth/login.spec.ts`

**Steps:**
  1. Precondición: cuenta descartable propia creada en el caso 10. No usar cuentas ajenas ni las de demo compartidas para los fallos. Ir a /auth/login.
    - expect: Se ven los campos email, password y el botón login-submit.
  2. Login válido con la cuenta descartable.
    - expect: Redirección a /account y el menú muestra el usuario.
  3. Cerrar sesión y probar login inválido: email inexistente nadie.descartable@example.com con 'Incorrecta#123'.
    - expect: login-error muestra 'Invalid email or password' y se queda en /auth/login.
  4. Probar campos vacíos y un email con formato inválido.
    - expect: Mensajes de validación de campo requerido y de formato.
  5. Bloqueo: solo con la cuenta descartable propia, ingresar contraseña errónea repetidas veces (la documentación del proyecto indica bloqueo tras unos 3 a 5 intentos; confirmar). No ejecutado en la exploración para no afectar cuentas.
    - expect: Tras el umbral aparece un mensaje de cuenta bloqueada, y el login válido también se rechaza mientras dure el bloqueo.
    - expect: Registrar el mensaje exacto y el umbral real.

### 6. Registro

**Seed:** `tests/seed.spec.ts`

#### 6.1. 10. Registro de usuario nuevo con validación de campos

**File:** `tests/registro/registro.spec.ts`

**Steps:**
  1. Ir a /auth/register y clic en register-submit sin completar nada.
    - expect: Aparecen: First name is required, Last name is required, Date of Birth is required (formato YYYY-MM-DD), Country is required, Postcode is required, House number is required, Street is required, City is required, State is required, Phone is required, Email is required, Password is required.
    - expect: No se crea la cuenta.
  2. Probar password 'abc' y con caracteres inválidos.
    - expect: 'Password must be minimal 6 characters long.' y 'Password can not include invalid characters.'.
  3. Probar email sin formato válido, fecha de nacimiento fuera de formato y teléfono con letras.
    - expect: Mensajes de validación para cada campo.
  4. Completar datos válidos. Ejemplo: Ana, Prueba, 1990-05-15, país a elección, postal 1000, número 12, calle Calle Test, ciudad Ciudad, estado Estado, teléfono 600123456, email único tipo ana.<timestamp>@example.com, password 'Prueba#2026x'. Clic en Register.
    - expect: Redirección a /auth/login.
  5. Iniciar sesión con la cuenta recién creada.
    - expect: Login exitoso a /account.
  6. Negativo: registrar de nuevo con el mismo email.
    - expect: Mensaje de que el email ya existe y no se duplica la cuenta.
