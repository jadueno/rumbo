# Backend — Rumbo

API REST (Node + TypeScript + Fastify) sobre Postgres para ingresos, gastos, deudas y transferencias.

## Arquitectura

```
src/
  domain/          tipos y puertos (interfaces de repositorio) — sin dependencias externas
  application/      casos de uso: validación + orquestación (list/create/update/remove)
  infrastructure/
    db/            pool de conexión, migraciones (node-pg-migrate), repositorios Postgres, seed
    http/          servidor Fastify, rutas CRUD genéricas
  test/            helpers de test (repositorio falso en memoria, pool de la BD de test)
```

Cada entidad (`incomes`, `expenses`, `debts`, `transfers`) sigue el mismo patrón: repositorio Postgres → caso de uso con validación → rutas `GET/POST/PUT/DELETE` genéricas registradas en `infrastructure/http/server.ts`.

## Comandos

```bash
npm install
npm run migrate:up     # crea las tablas
npm run seed           # carga los datos reales (seed.ts, ignorado por git — copia seed.example.ts)
npm run dev            # arranca con watch en http://localhost:3001
npm run build           # compila a dist/
npm run migrate:down    # revierte la última migración
```

## Tests

Dos capas, sin usar nunca la base de datos real:

- **Unitarios** (`application/*.test.ts`): casos de uso contra un repositorio falso en memoria (`src/test/fakeRepository.ts`). Rápidos, sin Postgres.
- **Integración** (`infrastructure/http/server.test.ts`): servidor Fastify real vía `app.inject()` contra una base de datos de test aislada (`TEST_DATABASE_URL`). `src/test/testPool.ts` se niega a arrancar si esa variable falta o coincide con `DATABASE_URL`, para no arriesgarse a truncar datos reales.

```bash
# una sola vez: crear la base de test y aplicarle las migraciones
psql "$DATABASE_URL" -c "CREATE DATABASE salud_financiera_test"
npm run test:migrate

npm test           # una pasada
npm run test:watch # modo watch
```

## Variables de entorno (`.env`, ignorado por git)

```
DATABASE_URL=postgres://usuario:password@localhost:5433/salud_financiera
PORT=3001
TEST_DATABASE_URL=postgres://usuario:password@localhost:5433/salud_financiera_test
```

## Datos reales

`src/infrastructure/db/seed.ts` contiene los datos financieros reales transcritos del Excel original y **no se versiona**. `seed.example.ts` es la plantilla pública con datos ficticios.
