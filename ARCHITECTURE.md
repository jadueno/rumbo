# Arquitectura y decisiones técnicas

Este documento explica cómo está construida la aplicación y por qué, pensado para quien quiera revisar el proyecto como muestra de trabajo (arquitectura, decisiones, testing) más que como manual de uso — para eso está el [README](README.md).

## Visión general

Rumbo es una aplicación de salud financiera personal: dashboard, ingresos, gastos, deudas, ahorro/inversión, historial/evolución en el tiempo y recomendaciones automáticas, con CRUD completo (crear/editar/borrar con confirmación) sobre ingresos, gastos, deudas, transferencias y cuentas bancarias. Todo el estado vive en una base de datos real, no en memoria ni en `localStorage` — cualquier cambio persiste y se recalcula en cascada por toda la app.

```
Frontend (React + TS)  ──HTTP/JSON──▶  Backend (Fastify + TS)  ──SQL──▶  PostgreSQL
     dominio puro                        hexagonal                      (Docker)
```

## Stack y por qué

| Capa | Elección | Motivo |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Rápido de iterar, tipado de extremo a extremo |
| Estilos | Tailwind v4 + variables CSS | Sistema de color validado (contraste, daltonismo) sin librería de componentes |
| Backend | Node + TypeScript + Fastify | Overhead mínimo, tipado compartido con el frontend a nivel de contrato |
| Base de datos | PostgreSQL en Docker (local) | Ver "Privacidad por diseño" más abajo — se descartó una BD gestionada en la nube a propósito |
| Migraciones | `node-pg-migrate` | Migraciones versionadas en TypeScript en vez de SQL suelto o *sync* automático de esquema |
| Sin ORM | Repositorios con `pg` + SQL explícito | El volumen de queries es pequeño y controlado; un ORM añadiría una capa de indirección sin beneficio claro aquí |
| Sin router | Estado local en `App.tsx` | 6 pantallas, navegación por pestañas — una librería de rutas sería complejidad sin beneficio a este tamaño |

## Arquitectura hexagonal (backend)

```
backend/src/
  domain/           tipos + puertos (interfaces de repositorio) — cero dependencias externas
  application/      casos de uso: validación de negocio + orquestación
  infrastructure/
    db/             pool de conexión, migraciones, repositorios Postgres, seed
    http/           servidor Fastify, rutas HTTP
```

Cada entidad (`incomes`, `expenses`, `debts`, `transfers`, `accounts`) sigue el mismo flujo: **repositorio Postgres → caso de uso con validación → ruta HTTP**. Un helper genérico (`registerCrudRoutes`) registra `GET/POST/PUT/DELETE` para las cuatro entidades con forma idéntica, evitando cuatro copias casi iguales del mismo código; `accounts` tiene rutas propias porque su regla de negocio es distinta (ver siguiente sección).

La capa `domain/` no importa nada de Fastify ni de `pg` — los casos de uso reciben el repositorio por inyección de dependencias simple (una función que devuelve un objeto), así que la lógica de validación se puede probar sin levantar una base de datos real.

## Modelo de dominio (frontend)

`src/domain/calculations.ts` contiene toda la lógica financiera como funciones puras (sin React, sin `fetch`, sin estado): totales de ingresos/gastos, tasa de ahorro, ratio deuda/ingresos, generación de recomendaciones, y el balance por cuenta bancaria. Las pantallas solo llaman a estas funciones y renderizan — la lógica de negocio no vive dentro de componentes de UI, así que se puede razonar sobre ella (o testear) de forma aislada.

Dos piezas de lógica destacables:

- **Saldo de deuda sin input manual**: cada deuda guarda un saldo conocido y el mes al que corresponde (`balanceAsOf`). La función `estimatedRemainingBalance` resta una cuota por cada mes transcurrido desde entonces hasta hoy — el dato nunca queda desactualizado sin que el usuario tenga que acordarse de tocarlo cada mes.
- **El mismo patrón, invertido, para fondo de emergencia e inversiones**: cada `SavingsTracker` se vincula a una cuenta y guarda un saldo de partida + el mes al que corresponde. En vez de restar una cuota fija (como la deuda), `estimatedTrackerBalance` suma, por cada mes transcurrido, el balance neto *actual* de la cuenta vinculada (`balanceByAccount(...).balance`: ingresos + transferencias entrantes − gastos − transferencias salientes) — reutilizando un cálculo que ya existía para otra pantalla, en vez de duplicar la lógica de "cuánto entra/sale de esta cuenta". Es una aproximación (asume que ese ritmo mensual se ha mantenido constante), igual que la de las deudas.
- **Recomendaciones basadas en reglas, no en IA**: un motor de reglas (`buildRecommendations`) detecta señales concretas — dinero acumulado sin destino en cuentas corrientes, tasa de ahorro por debajo de un umbral, fondo de emergencia incompleto, carga de deuda alta, cashflow negativo, patrimonio por debajo del recomendado para la edad, varias deudas activas a la vez, ingresos o cuentas sin diversificar, fondo de emergencia completo sin ninguna inversión en marcha — y las prioriza por severidad. Determinista y explicable, no una caja negra.
- **Score de salud financiera (0-100) explicable, no una caja negra**: `scoreFromMetrics`/`financialHealthScore` combinan tasa de ahorro, carga de deuda, progreso del fondo de emergencia y ratio de dinero ocioso en un único número mediante una media ponderada con pesos y umbrales fijos y documentados (los mismos umbrales que ya usa `buildRecommendations`, para que el score y las recomendaciones cuenten siempre la misma historia). Cada factor se muestra desglosado en la UI con su propia explicación, nunca solo el número final.
- **Simulador "qué pasaría si..." sin tocar la base de datos**: `simulateAdjustments` reutiliza las mismas funciones puras de dominio sobre un perfil hipotético construido en memoria (ajustes de ingresos/gastos/aportación a ahorro), sin persistir nada. El fondo de emergencia y el ratio de dinero ocioso son saldos acumulados, no flujos mensuales, así que se mantienen fijos a propósito — proyectarlos hacia adelante es un problema distinto (histórico/evolución temporal), no este simulador.
- **Propiedades: valor de mercado suma al patrimonio, el alquiler no se cuenta dos veces.** `currentNetWorth` suma el valor estimado de las propiedades a los seguimientos de ahorro/inversión (menos la deuda pendiente, que ya incluye cualquier hipoteca dada de alta como deuda genérica — no hace falta vincular explícitamente propiedad↔hipoteca). El alquiler que puedan dar es un flujo, no un saldo: se etiqueta con el mismo campo `property` que ya existía en los gastos (ahora también en ingresos) y `rentalProfitByProperty` calcula el beneficio neto solo con fines informativos, sin sumarlo de nuevo al patrimonio — ya cuenta como ingreso normal en `totalMonthlyIncome`.
- **La tasa de ahorro se deriva de los seguimientos reales, no de una lista fija.** La primera versión de `savingsRate` tenía un nombre de cuenta de ahorro hardcodeado en el código y miraba un flag manual (`isSavingsOrInvestment`) en las transferencias — funcionaba, pero vivía desconectada de la funcionalidad real de seguimiento de fondo de emergencia/inversiones que se construyó después. Se refactorizó para que `deliberateSavingsAndInvestment`/`idleSurplus` calculen sobre el conjunto de cuentas que tienen un `SavingsTracker` vinculado en ese momento: lo que hay tracked es "deliberado", el resto con saldo positivo es "sin destino". Así la tasa se mantiene correcta aunque el usuario cree, borre o cambie de cuenta un seguimiento, sin tocar ningún dato de "configuración". El flag `isSavingsOrInvestment`, ya sin ningún consumidor, se acabó eliminando del todo (tipo, columna en Postgres vía migración, repositorio) en vez de dejarlo como dato muerto.

## Recalculado reactivo de extremo a extremo

Todas las pantallas reciben el mismo `FinancialProfile` calculado a partir de los datos que devuelve la API. Editar un ingreso, borrar un gasto o añadir una transferencia dispara un `reload()` que vuelve a pedir las 5 entidades y reconstruye el perfil — así que el dashboard, el ratio deuda/ingresos, la tasa de ahorro y las recomendaciones se recalculan solos, sin ningún paso manual de "guardar y refrescar".

## Confirmación de borrado sin `window.confirm`

Todo borrado (ingreso, gasto, deuda, transferencia, cuenta) pasa por un modal de confirmación propio, no por el `confirm()` nativo del navegador. Está implementado como un contexto de React (`ConfirmProvider` + hook `useConfirm`) que expone una función `confirm(mensaje): Promise<boolean>`: guarda el mensaje pendiente en estado, renderiza el modal, y resuelve la promesa cuando el usuario pulsa un botón. Cualquier pantalla puede hacer `if (await confirm(...)) { borrar(); }` sin preocuparse de cómo se renderiza el modal.

## Reglas de negocio reales, no solo CRUD

- **Borrado de cuentas.** Las cuentas bancarias son una entidad propia en la base de datos (no solo un texto suelto en cada ingreso/gasto). Borrar una cuenta que todavía tiene ingresos, gastos o transferencias asociados está bloqueado por el backend, que responde con el número exacto de movimientos que hay que quitar antes — en vez de borrar en cascada (perder datos sin querer) o dejar referencias huérfanas.
- **Como mucho un fondo de emergencia.** La restricción de que solo puede existir un `SavingsTracker` de tipo `emergency_fund` está en dos capas a la vez: un índice único parcial en Postgres (`where kind = 'emergency_fund'`) como garantía de última línea, y una comprobación en el caso de uso que devuelve un mensaje de error legible antes de llegar a la base de datos. Las inversiones (`kind = 'investment'`), en cambio, no tienen ese límite.

## Importación de extractos bancarios

Cada banco exporta sus movimientos en un formato distinto y sin categorías fiables; en vez de pedir que se traduzcan a mano, `domain/statementImport.ts` normaliza los dos formatos reales que maneja (ING en `.xls`/`.xlsx`/`.csv`, Bankinter en PDF) a la misma forma interna, agrupa transacciones del mismo comercio y las compara contra los gastos ya apuntados en la app — todo en el navegador, sin subir el archivo a ningún sitio.

- **PDF sin librería de "extracción de tablas"**: el PDF de Bankinter no tiene una tabla real, solo texto posicionado. `data/readPdfStatement.ts` reconstruye cada línea agrupando los fragmentos de texto de `pdfjs-dist` por su coordenada Y (misma fila) y ordenándolos por X (orden de columnas); `parseBankinterPdfLines` extrae los movimientos con expresiones regulares sobre esas líneas ya reconstruidas.
- **El importe se calcula por diferencia de saldo, no por columna.** El texto reconstruido pierde la alineación que distinguiría cargo de abono en una columna fija. En vez de intentar adivinarla, se parte del "saldo anterior" de cada sección y cada importe sale de `saldo_nuevo − saldo_anterior`, arrastrando el saldo línea a línea — el signo sale solo, y de paso sirve de comprobación (la suma tiene que cuadrar con el saldo final impreso).
- **Detecta traspasos entre tus propias cuentas sin datos hardcodeados.** Bankinter mezcla movimientos entre cuentas propias ("TRANS /Juan Antonio Madueño Ga") con gastos reales, sin categoría que los distinga (a diferencia de ING, que sí marca "Movimientos excluidos"). En vez de hardcodear un nombre, `isInternalTransfer` extrae el apellido del titular de la propia cabecera del PDF ("Estimado Sr. ...") y lo usa para detectar traspasos a nombre propio — genérico para cualquier extracto de Bankinter, no acoplado a una persona concreta.
- **Un PDF puede traer varias cuentas a la vez** (nómina y corriente en el mismo extracto mensual): cada `StatementSection` detectada se muestra por separado con su propio selector para asignarla a la cuenta de la app que corresponda, en vez de asumir una única cuenta por archivo.
- **Bug real de compatibilidad encontrado y corregido en Safari/iOS**: `pdfjs-dist` falla al cargar porque usa `Promise.withResolvers` (no existe en Safari < 17.4) y falla al leer el texto porque `page.getTextContent()` hace internamente `for await (const value of readableStream)`, que necesita que `ReadableStream` soporte iteración asíncrona — poco fiable en Safari/iOS. Se añadió un polyfill de `Promise.withResolvers` y se sustituyó `getTextContent()` por una lectura manual del mismo stream con `getReader()`/`read()`, sin cambiar el resultado. Verificado en Chromium (Playwright) y confirmado por el usuario en Safari/iOS tras el fix.

## Historial y evolución en el tiempo

Todo el resto del modelo son cantidades mensuales recurrentes sin fecha propia (cuánto ingresas *ahora*, cuánto debes *ahora*) — no había forma de ver una tendencia. `snapshots` guarda una foto mensual (patrimonio, tasa de ahorro, score) que la persona decide guardar cuando quiere, no un histórico automático: no hay forma de reconstruir meses pasados que no se guardaron a propósito, así que inventar datos retroactivos sería peor que no tenerlos.

- **Como mucho un snapshot por mes**, con el mismo patrón de doble capa que el fondo de emergencia: restricción única en Postgres (`unique` en la columna `month`) más una comprobación en el caso de uso con un mensaje legible.
- **Gráficas construidas a mano en SVG, sin librería de charts** (coherente con "sin librería de componentes" del resto del stack), siguiendo la skill de dataviz del entorno: línea de 2px, marcadores ≥8px con anillo en el color de superficie, cuadrícula recessive, etiqueta directa solo en el último punto (nunca un número por punto), y una capa de hover con crosshair + tooltip accesible por teclado. Patrimonio, tasa de ahorro y score tienen escalas muy distintas (euros, ratio, 0-100), así que son **tres gráficas de una sola serie** en vez de una con dos ejes — un eje dual habría sido el error de gráfico más común posible.
- **Los colores de marca ya existentes fallaban el validador de la skill para este uso concreto.** `--series-violet`/`--series-savings`/`--series-income` están pensados como *relleno* de botones/badges con texto oscuro encima, así que son bastante claros; `validate_palette.js` (banda OKLCH de luminosidad en modo oscuro) los marca como demasiado claros para un trazo de línea fino sobre fondo oscuro. Se oscurecieron un 15% solo en el trazo del gráfico (`color-mix(in srgb, var(--series-violet) 85%, black)` etc.), sin tocar las variables compartidas que usa el resto de la app — mismo tono, mismo significado, ajustado al uso.

## Autenticación opcional

La API no tiene autenticación por defecto: el uso real es personal, por Tailscale, y añadir login habría sido fricción sin beneficio para ese caso. Aun así, `infrastructure/http/auth.ts` implementa un middleware de bearer token activable con la variable de entorno `API_TOKEN` (vacía por defecto = sin cambios de comportamiento): si se configura, exige `Authorization: Bearer <token>` en todas las rutas salvo `/health`. El frontend manda el mismo token si `VITE_API_TOKEN` está puesto. Pensado para el día que la app se exponga más allá de una red privada (p. ej. una demo pública), sin tener que construir nada nuevo entonces.

## Privacidad por diseño

Es una app de finanzas personales reales, así que la privacidad no es un añadido sino una restricción de diseño desde el principio:

- **Base de datos local, no en la nube.** Se evaluó explícitamente Supabase (había un servidor MCP ya conectado) frente a Postgres local en Docker, y se optó por mantener los datos financieros reales fuera de cualquier proveedor externo.
- **Datos reales fuera del repositorio.** Los archivos con datos reales (config estática del frontend, seed del backend) están en `.gitignore`; el repo solo versiona plantillas de ejemplo (`*.example.ts`) con datos ficticios y la forma exacta que deben tener.
- **Acceso desde el móvil sin salir a internet.** El acceso remoto se hace por Tailscale (red privada punto a punto), no por un despliegue público — el backend escucha en todas las interfaces y el frontend llama a la API usando el mismo host desde el que se cargó la página (`window.location`), en vez de una URL fija, para que funcione igual en `localhost`, en red local o en Tailscale sin configuración extra.
- **Auditoría de historial antes de hacer el repo público.** Antes de subir el proyecto a GitHub se auditó *todo* el historial de commits (no solo el estado actual) buscando cualquier dato real que hubiera quedado en un mensaje de commit o en un valor de ejemplo (placeholders de formulario, contraseñas por defecto). Se encontraron dos mensajes de commit que mencionaban entidades reales y un placeholder con una fecha real, y se reescribieron de forma no interactiva (`git filter-branch --msg-filter`) antes de publicar — el contenido de los commits no cambió, solo el texto descriptivo.

## Rigor de pruebas: bugs reales encontrados, no hipotéticos

Todo el CRUD se verificó de extremo a extremo con Playwright manejado directamente (sin usar un MCP de navegador), incluyendo altas y bajas con importes no redondos a propósito. Eso sacó a la luz varios bugs reales que con datos "bonitos" (números enteros redondos) habrían pasado desapercibidos:

1. **Validación HTML5 silenciosa**: los `<input type="number">` con `step` fijo (p. ej. `step={10}`) bloquean el envío del formulario si el importe no es múltiplo exacto del step — sin mostrar ningún error visible en la interfaz, el navegador simplemente no dispara el `submit`. Se corrigió a `step={0.01}` en todos los inputs de importe.
2. **CORS bloqueaba los borrados**: el plugin de CORS del backend no anunciaba `DELETE` en el preflight por defecto; hubo que declarar los métodos permitidos explícitamente.
3. **Content-Type en peticiones sin cuerpo**: el cliente HTTP del frontend mandaba siempre `Content-Type: application/json`, incluso en `DELETE` sin body — Fastify rechaza JSON vacío con ese header puesto. Se corrigió para solo enviarlo cuando hay cuerpo real.
4. **Acceso desde el móvil roto por *binding* de red**: el backend escuchaba solo en `127.0.0.1` y el frontend llamaba siempre a `localhost` — funcionaba en el Mac pero no desde ningún otro dispositivo. Se corrigió el *binding* a `0.0.0.0` y se cambió la resolución de la URL de la API a partir del host de la petición real.
5. **Los tests del backend se colaban en `dist/` y se ejecutaban por duplicado**: `tsc` compilaba también los `*.test.ts` al construir el proyecto, y `vitest` los recogía tanto desde `src/` como desde `dist/` — dos suites de integración corriendo en paralelo contra la misma base de datos de test, con fallos que parecían *flakiness* pero eran una carrera real entre dos procesos truncando las mismas tablas a la vez. Se corrigió con un `tsconfig.build.json` que excluye los tests solo del build, sin perder el type-check completo del proyecto.
6. **Vitest se colaba entre frontend y backend según desde dónde se lanzara**: sin una config de test propia por proyecto, subía a buscar el `vite.config.ts` más cercano — desde la raíz del repo recogía (y fallaba) los tests del backend por falta de `TEST_DATABASE_URL`; desde `backend/` heredaba por error la config de test del frontend (jsdom, setup files que no existen ahí). Cada proyecto tiene ahora su propia config de test acotada a su carpeta.
7. **Un reinicio de Postgres tumbaba el backend real entero**: el `Pool` de `pg` no tenía ningún listener de `'error'`; cuando el contenedor de Postgres se reinició durante una sesión de trabajo (para probar un cambio no relacionado), la conexión inactiva que el pool tenía abierta emitió un error no capturado que Node propaga como excepción y mata el proceso — el backend real se cayó de verdad, en directo, mientras se revisaba otra cosa. Se detectó al momento (el propio backend dejó de responder) y se corrigió añadiendo `pool.on("error", ...)` en `infrastructure/db/pool.ts`; verificado reproduciendo el mismo reinicio contra una base de datos de prueba aislada, antes y después del fix.

Además, comparar recuentos de filas antes/después de cada tanda de pruebas manuales destapó un bug del propio proceso de testing: un selector de Playwright poco específico (`.first()` sobre un botón con texto genérico) borró por error un dato real durante una prueba. Se detectó por la propia disciplina de verificación (no por casualidad), se comunicó explícitamente y solo se restauró tras confirmación — nunca se restauran datos financieros de forma automática sin que la persona lo pida.

**Cobertura automatizada actual** (además de la verificación manual de arriba): en el backend, casos de uso testeados contra un repositorio en memoria sin Postgres, más integración real vía `app.inject()` de Fastify contra una base de datos de test aislada (nunca la real — `createTestPool` se niega a arrancar si esa variable falta o coincide con la de producción); en el frontend, la lógica de dominio (cálculos financieros, parseo de extractos bancarios) y los formularios/pantallas más importantes con React Testing Library; y una suite E2E con Playwright (`e2e/`) que levanta backend + frontend + Postgres de test reales y prueba el camino feliz completo desde el navegador (crear cuenta, añadir/borrar gasto e ingreso con confirmación). Ver `.github/workflows/ci.yml` para cómo se orquesta todo, incluyendo el servicio Postgres efímero de los jobs de backend y E2E.

## Estructura del repositorio

```
src/
  domain/           tipos + cálculos financieros puros + parseo de extractos bancarios
  data/             cliente HTTP, mapeo API↔dominio, hook de estado de la app, lectura de PDF
  features/         una carpeta por pantalla, con sus formularios de alta
  components/       UI reutilizable (ConfirmProvider, TrendChart, ...)
  test/             setup de React Testing Library (jsdom, polyfills)
backend/
  src/domain/       tipos + puertos
  src/application/  casos de uso con validación
  src/infrastructure/db/    migraciones, repositorios, seed
  src/infrastructure/http/  servidor Fastify, rutas, autenticación opcional
  src/test/         repositorio falso en memoria, pool de la BD de test
e2e/                suite Playwright de extremo a extremo (navegador real)
docker-compose.yml  Postgres local
```

## Qué añadiría con más tiempo

Ya hecho (estaba en esta lista, dejo constancia de qué era y cómo quedó): tests automatizados en las dos capas del backend y en dominio+componentes del frontend, suite E2E con Playwright en CI, CI de lint+test+build, backup automatizado de la base de datos, exportación de datos bajo demanda, historial/evolución en el tiempo, y autenticación opcional por token. Lo que queda pendiente de verdad:

- **Sin demo pública en vivo.** El README enseña capturas y un GIF, pero no hay una URL desplegada — desplegar hoy expondría un formulario editable sin autenticación a quien encuentre la URL (`API_TOKEN` existe justo para ese caso, pero decidir dónde alojarlo y con qué datos ficticios es una decisión de producto pendiente, no técnica).
- **Un snapshot mensual es una foto, no una serie continua.** Si un mes se te olvida guardarlo, ese mes no existe en el historial — no hay forma de reconstruirlo a posteriori con datos fiables, así que es una limitación aceptada, no un bug.
- **Multi-banco limitado a dos formatos.** La importación de extractos solo reconoce ING y Bankinter; añadir un banco nuevo significa escribir un parser nuevo (el patrón ya está puesto, pero no es automático).
