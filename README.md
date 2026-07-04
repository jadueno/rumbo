# Salud Financiera

App personal (un solo usuario, sin backend) para ver de un vistazo cómo va tu economía: ingresos, gastos, deudas, ahorro/inversión y recomendaciones, a partir de los datos de `Libertad_financiera.xlsx`.

## Arrancar en local

```bash
npm install
npm run dev
```

## Datos

`src/data/finances.ts` contiene los datos reales y **no se versiona** (está en `.gitignore`). Para trabajar en el proyecto sin esos datos:

```bash
cp src/data/finances.example.ts src/data/finances.ts
```

y edita los valores según `src/domain/types.ts` (`FinancialProfile`).

## Estructura

- `src/domain/` — tipos y cálculos financieros puros (sin UI, sin dependencias externas).
- `src/data/` — datos (`finances.ts`, ignorado por git; `finances.example.ts`, plantilla).
- `src/features/` — una pantalla por carpeta (resumen, ingresos, gastos, deudas, ahorro, recomendaciones).
- `src/components/` — piezas de UI reutilizables.

El fondo de emergencia no incluye un saldo inicial en el Excel de origen: se introduce a mano en la pantalla "Ahorro" y se guarda en `localStorage` del navegador.
