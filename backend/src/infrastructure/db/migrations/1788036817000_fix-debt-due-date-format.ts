import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

// `due_date` se guardó en algunas deudas como "MM/YYYY" (p. ej. "07/2048") en vez del
// formato "YYYY-MM" que espera el resto de la app (mismo formato que ya usa
// `balance_as_of` en esta misma tabla) — formatMonth() no sabía parsear eso y mostraba
// "Invalid Date". El formulario de alta ya genera el formato correcto; esto solo
// normaliza los datos existentes que se guardaron mal.
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    update debts
    set due_date = to_char(to_date(due_date, 'MM/YYYY'), 'YYYY-MM')
    where due_date ~ '^\\d{2}/\\d{4}$'
  `);
}

export async function down(): Promise<void> {
  // No se revierte: no hay forma de distinguir qué filas venían de "MM/YYYY" tras
  // normalizarlas, y el formato "YYYY-MM" es el correcto en cualquier caso.
}
