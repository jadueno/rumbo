# Arquitectura y decisiones técnicas

Este documento explica cómo está construida la aplicación y por qué, pensado para quien quiera revisar el proyecto como muestra de trabajo (arquitectura, decisiones, testing) más que como manual de uso — para eso está el [README](README.md).

## Visión general

Es una aplicación de salud financiera personal: dashboard, ingresos, gastos, deudas, ahorro/inversión y recomendaciones automáticas, con CRUD completo (crear/editar/borrar con confirmación) sobre ingresos, gastos, deudas, transferencias y cuentas bancarias. Todo el estado vive en una base de datos real, no en memoria ni en `localStorage` — cualquier cambio persiste y se recalcula en cascada por toda la app.

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
| Sin router | Estado local en `App.tsx` | 5 pantallas, navegación por pestañas — una librería de rutas sería complejidad sin beneficio a este tamaño |

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
- **Recomendaciones basadas en reglas, no en IA**: un motor de reglas simple (`buildRecommendations`) detecta señales concretas — dinero acumulado sin destino en cuentas corrientes, tasa de ahorro por debajo de un umbral, fondo de emergencia incompleto, carga de deuda alta — y las prioriza por severidad. Determinista y explicable, no una caja negra.

## Recalculado reactivo de extremo a extremo

Todas las pantallas reciben el mismo `FinancialProfile` calculado a partir de los datos que devuelve la API. Editar un ingreso, borrar un gasto o añadir una transferencia dispara un `reload()` que vuelve a pedir las 5 entidades y reconstruye el perfil — así que el dashboard, el ratio deuda/ingresos, la tasa de ahorro y las recomendaciones se recalculan solos, sin ningún paso manual de "guardar y refrescar".

## Confirmación de borrado sin `window.confirm`

Todo borrado (ingreso, gasto, deuda, transferencia, cuenta) pasa por un modal de confirmación propio, no por el `confirm()` nativo del navegador. Está implementado como un contexto de React (`ConfirmProvider` + hook `useConfirm`) que expone una función `confirm(mensaje): Promise<boolean>`: guarda el mensaje pendiente en estado, renderiza el modal, y resuelve la promesa cuando el usuario pulsa un botón. Cualquier pantalla puede hacer `if (await confirm(...)) { borrar(); }` sin preocuparse de cómo se renderiza el modal.

## Regla de negocio real en el borrado de cuentas

Las cuentas bancarias son una entidad propia en la base de datos (no solo un texto suelto en cada ingreso/gasto). Borrar una cuenta que todavía tiene ingresos, gastos o transferencias asociados está bloqueado por el backend, que responde con el número exacto de movimientos que hay que quitar antes — en vez de borrar en cascada (perder datos sin querer) o dejar referencias huérfanas.

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

Además, comparar recuentos de filas antes/después de cada tanda de pruebas automatizadas destapó un bug del propio proceso de testing: un selector de Playwright poco específico (`.first()` sobre un botón con texto genérico) borró por error un dato real durante una prueba. Se detectó por la propia disciplina de verificación (no por casualidad), se comunicó explícitamente y solo se restauró tras confirmación — nunca se restauran datos financieros de forma automática sin que la persona lo pida.

## Estructura del repositorio

```
src/
  domain/           tipos + cálculos financieros puros
  data/             cliente HTTP, mapeo API↔dominio, hook de estado de la app
  features/         una carpeta por pantalla, con sus formularios de alta
  components/       UI reutilizable (incluye el ConfirmProvider)
backend/
  src/domain/       tipos + puertos
  src/application/  casos de uso con validación
  src/infrastructure/db/    migraciones, repositorios, seed
  src/infrastructure/http/  servidor Fastify, rutas
docker-compose.yml  Postgres local
```

## Qué añadiría con más tiempo

- Tests automatizados (unitarios sobre `domain/calculations.ts`, que ya está diseñado para eso al ser funciones puras; e2e con Playwright ya como suite en CI, no solo como scripts manuales de verificación).
- Autenticación, si en algún momento deja de ser de un solo usuario.
- CI (lint + typecheck + build en cada push).
