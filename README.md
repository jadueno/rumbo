# Rumbo

[![CI](https://github.com/jadueno/rumbo/actions/workflows/ci.yml/badge.svg)](https://github.com/jadueno/rumbo/actions/workflows/ci.yml)

App personal (un solo usuario) para ver de un vistazo cómo va tu economía: ingresos, gastos, deudas, ahorro/inversión, historial/evolución en el tiempo y recomendaciones. Ingresos, gastos, deudas, transferencias y cuentas se pueden añadir/editar/borrar libremente (con confirmación antes de borrar) — se guardan en una base de datos Postgres local, así que puedes "jugar" con los números sin miedo a romper nada real.

📐 Si te interesa la arquitectura, las decisiones técnicas y los bugs reales encontrados durante el desarrollo, están en **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Capturas

Datos ficticios de ejemplo, no los reales del dueño de la app.

| Resumen (escritorio) | Ingresos y gastos (escritorio) | Resumen (móvil) |
| --- | --- | --- |
| ![Resumen](docs/screenshots/resumen-desktop.png) | ![Ingresos y gastos](docs/screenshots/gastos-desktop.png) | ![Resumen en móvil](docs/screenshots/resumen-movil.png) |

**Importar movimientos bancarios** — sube el extracto del banco (cualquier banco en `.xls`/`.xlsx`/`.csv` — probado con ING e Ibercaja —, Bankinter o BBVA en PDF) y la app detecta qué gastos recurrentes no tienes apuntados, agrupando el mismo comercio aunque el banco cambie el código de operación cada mes:

![Importar movimientos bancarios](docs/screenshots/importar-extractos-desktop.png)

## Configuración inicial (solo la primera vez)

Necesitas Node.js, npm y Docker instalados.

```bash
# 1. Variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
# Edita ambos .env y pon tu propia contraseña de Postgres (debe
# coincidir en los dos archivos, tanto en POSTGRES_PASSWORD como
# dentro de DATABASE_URL).

# 2. Base de datos
docker compose up -d

# 3. Backend
cd backend
npm install
npm run migrate:up   # crea las tablas y las deja con un perfil y datos de ejemplo
cd ..

# 4. Frontend
npm install
```

`npm run migrate:up` ya te deja la app usable con datos de ejemplo (perfil, cuentas, ingresos,
gastos, una deuda...) — no hace falta copiar ni editar ningún archivo a mano para arrancar.
Cuando quieras meter tus datos reales, hazlo desde la propia app (Perfil, y los botones
"+ Añadir..."/"Eliminar" de cada pantalla) borrando lo de ejemplo que no necesites.

Si prefieres cargar tus datos reales de golpe por script en vez de desde la UI, existe
también la vía avanzada de `backend/src/infrastructure/db/seed.ts` (plantilla en
`seed.example.ts`, ignorado por git) + `npm run seed` — pero es opcional, no un paso
obligatorio de la instalación.

## Arrancar en el día a día

Necesitas 3 cosas corriendo a la vez (cada una en su terminal, o usa `~/AI/proyectos/start-project.sh rumbo` si lo tienes configurado para levantarlas todas de golpe):

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend
cd backend && npm run dev     # http://localhost:3001

# 3. Frontend (desde la raíz del proyecto)
npm run dev                   # http://localhost:5183 (y accesible en tu red/Tailscale, ver abajo)
```

Abre `http://localhost:5183` en el navegador.

## Tests

```bash
npm test              # frontend: dominio + componentes (Vitest + React Testing Library)
cd backend && npm test  # backend: casos de uso + integración HTTP real (ver backend/README.md)
npm run test:e2e      # E2E: backend + frontend + Postgres de test reales, con Playwright
```

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
- **Perfil (nombre, fecha de nacimiento, objetivo del fondo de emergencia)**: pantalla "Perfil", vive en Postgres como el resto — la edad se calcula sola a partir de la fecha de nacimiento, no se guarda como número suelto.
- El **saldo pendiente de cada deuda** no se edita a mano: cada deuda guarda su saldo conocido y el mes al que corresponde (`balanceAsOf`), y la app resta una cuota por cada mes transcurrido desde entonces.
- El **fondo de emergencia y las inversiones** (pantalla "Ahorro") funcionan igual que las deudas pero al revés: se vinculan a una cuenta y guardan un saldo de partida + el mes al que corresponde, y la app suma sola cada mes el balance neto de esa cuenta desde entonces. El fondo de emergencia es como mucho uno; las inversiones pueden ser varias, con su propio alta/baja.
- El **score de salud financiera** (pantalla "Resumen") combina tasa de ahorro, carga de deuda, progreso del fondo de emergencia y dinero ocioso en un único número 0-100, con desglose explicado factor a factor.
- El **simulador** (pantalla "Simulador") deja tocar ingresos, gastos y aportación extra a ahorro con sliders y ver el impacto en cashflow, tasa de ahorro y score al momento, sin guardar nada.
- Las **propiedades** (pantalla "Ahorro") guardan nombre + valor estimado de mercado, que suma al patrimonio neto. Si dan alquiler, se vincula el ingreso (y los gastos) a esa propiedad real desde un desplegable — para ver el beneficio neto — esa renta ya cuenta como ingreso normal, no se vuelve a sumar al patrimonio.

## Estructura

- `src/domain/` — tipos y cálculos financieros puros (sin UI, sin red).
- `src/data/` — `api.ts` + `useFinancialData.ts` (cliente HTTP y estado de la app).
- `src/features/` — una pantalla por carpeta (resumen, gastos [ingresos+gastos+transferencias+cuentas], deudas, ahorro, simulador, historial, recomendaciones, perfil), con sus formularios de alta.
- `src/components/` — piezas de UI reutilizables (incluye `ConfirmProvider`, el modal de confirmación de borrados).
- `backend/` — API en Node + TypeScript (Fastify) sobre Postgres, arquitectura hexagonal (`domain/` → `application/` → `infrastructure/`). Ver `backend/README.md`.
- `docker-compose.yml` — Postgres local, puerto 5433.

## Privacidad

Los datos financieros reales no salen de tu máquina: no se suben a GitHub (`.gitignore` cubre `backend/src/infrastructure/db/seed.ts` y los `.env`), la base de datos es un contenedor Docker local, y no hay ningún despliegue remoto configurado. El acceso desde el móvil vía Tailscale tampoco expone nada a internet: es una red privada solo entre tus propios dispositivos.
