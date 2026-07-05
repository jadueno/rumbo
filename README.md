# Rumbo

[![CI](https://github.com/jadueno/salud-financiera/actions/workflows/ci.yml/badge.svg)](https://github.com/jadueno/salud-financiera/actions/workflows/ci.yml)

App personal (un solo usuario) para ver de un vistazo cómo va tu economía: ingresos, gastos, deudas, ahorro/inversión y recomendaciones. Ingresos, gastos, deudas, transferencias y cuentas se pueden añadir/editar/borrar libremente (con confirmación antes de borrar) — se guardan en una base de datos Postgres local, así que puedes "jugar" con los números sin miedo a romper nada real.

📐 Si te interesa la arquitectura, las decisiones técnicas y los bugs reales encontrados durante el desarrollo, están en **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Capturas

Datos ficticios de ejemplo, no los reales del dueño de la app.

| Resumen (escritorio) | Ingresos y gastos (escritorio) | Resumen (móvil) |
| --- | --- | --- |
| ![Resumen](docs/screenshots/resumen-desktop.png) | ![Ingresos y gastos](docs/screenshots/gastos-desktop.png) | ![Resumen en móvil](docs/screenshots/resumen-movil.png) |

## Configuración inicial (solo la primera vez)

Necesitas Node.js, npm y Docker instalados.

```bash
# 1. Variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
# Edita ambos .env y pon tu propia contraseña de Postgres (debe
# coincidir en los dos archivos, tanto en POSTGRES_PASSWORD como
# dentro de DATABASE_URL).

# 2. Tus datos reales (no vienen en el repo, están en .gitignore)
cp src/data/finances.example.ts src/data/finances.ts
cp backend/src/infrastructure/db/seed.example.ts backend/src/infrastructure/db/seed.ts
# Edita ambos con tu edad/cuentas (finances.ts) y tus ingresos,
# gastos, deudas y transferencias reales (seed.ts). Revisa
# src/domain/types.ts para ver la forma exacta de cada campo.

# 3. Base de datos
docker compose up -d

# 4. Backend
cd backend
npm install
npm run migrate:up   # crea las tablas
npm run seed         # carga los datos de seed.ts
cd ..

# 5. Frontend
npm install
```

## Arrancar en el día a día

Necesitas 3 cosas corriendo a la vez (cada una en su terminal, o usa `~/AI/proyectos/start-project.sh salud-financiera` si lo tienes configurado para levantarlas todas de golpe):

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend
cd backend && npm run dev     # http://localhost:3001

# 3. Frontend (desde la raíz del proyecto)
npm run dev                   # http://localhost:5183 (y accesible en tu red/Tailscale, ver abajo)
```

Abre `http://localhost:5183` en el navegador.

## Usar desde el móvil

El frontend arranca con `--host`, así que ya escucha en todas las interfaces de red, no solo en `localhost`. Para verlo desde el móvil sin salir a internet, lo más simple y privado es [Tailscale](https://tailscale.com):

1. Instala Tailscale en el Mac y en el móvil, e inicia sesión con la misma cuenta en los dos.
2. En el Mac, mira tu IP de Tailscale: `tailscale ip -4` (algo como `100.x.y.z`).
3. Con los 3 servicios arrancados (ver arriba), abre en el navegador del móvil: `http://<esa-IP>:5183`.

Notas:
- El backend debe escuchar en `0.0.0.0` (ya viene así configurado en `backend/src/index.ts`) para que el móvil pueda llegar a la API, no solo el propio Mac.
- El frontend detecta solo el host desde el que se cargó la página para llamar a la API (`src/data/api.ts`), así que no hace falta configurar nada aparte al cambiar de red local a Tailscale.
- Si prefieres no usar Tailscale, sirve cualquier red donde el móvil y el Mac se vean entre sí (misma WiFi) usando la IP local del Mac en vez de la de Tailscale — pero entonces solo funciona en esa red, no desde fuera de casa.

## Datos

- **Ingresos, gastos, deudas, transferencias y cuentas**: viven en Postgres, se editan desde la propia app (botones "+ Añadir..." y "Eliminar" en cada pantalla, con modal de confirmación). El backend valida (importes no negativos, categorías válidas, no se puede borrar una cuenta con movimientos asociados) antes de guardar.
- **Edad y estructura de cuentas de referencia**: config estática en `src/data/finances.ts` (ignorado por git, con `finances.example.ts` como plantilla) — no cambia con el día a día.
- El **saldo pendiente de cada deuda** no se edita a mano: cada deuda guarda su saldo conocido y el mes al que corresponde (`balanceAsOf`), y la app resta una cuota por cada mes transcurrido desde entonces.
- El **fondo de emergencia y las inversiones** (pantalla "Ahorro") funcionan igual que las deudas pero al revés: se vinculan a una cuenta y guardan un saldo de partida + el mes al que corresponde, y la app suma sola cada mes el balance neto de esa cuenta desde entonces. El fondo de emergencia es como mucho uno; las inversiones pueden ser varias, con su propio alta/baja.
- El **score de salud financiera** (pantalla "Resumen") combina tasa de ahorro, carga de deuda, progreso del fondo de emergencia y dinero ocioso en un único número 0-100, con desglose explicado factor a factor.
- El **simulador** (pantalla "Simulador") deja tocar ingresos, gastos y aportación extra a ahorro con sliders y ver el impacto en cashflow, tasa de ahorro y score al momento, sin guardar nada.

## Estructura

- `src/domain/` — tipos y cálculos financieros puros (sin UI, sin red).
- `src/data/` — `finances.ts` (config estática real, ignorado por git), `api.ts` + `useFinancialData.ts` (cliente HTTP y estado de la app).
- `src/features/` — una pantalla por carpeta (resumen, gastos [ingresos+gastos+transferencias+cuentas], deudas, ahorro, simulador, recomendaciones), con sus formularios de alta.
- `src/components/` — piezas de UI reutilizables (incluye `ConfirmProvider`, el modal de confirmación de borrados).
- `backend/` — API en Node + TypeScript (Fastify) sobre Postgres, arquitectura hexagonal (`domain/` → `application/` → `infrastructure/`). Ver `backend/README.md`.
- `docker-compose.yml` — Postgres local, puerto 5433.

## Privacidad

Los datos financieros reales no salen de tu máquina: no se suben a GitHub (`.gitignore` cubre `finances.ts`, `backend/src/infrastructure/db/seed.ts` y los `.env`), la base de datos es un contenedor Docker local, y no hay ningún despliegue remoto configurado. El acceso desde el móvil vía Tailscale tampoco expone nada a internet: es una red privada solo entre tus propios dispositivos.
