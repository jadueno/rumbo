import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * Da un punto de partida usable nada más clonar el repo y correr `npm run migrate:up`, sin
 * el paso manual de copiar finances.ts/seed.ts: perfil por defecto y datos de ejemplo (mismo
 * contenido que antes traía seed.example.ts). Cada bloque comprueba su propia condición de
 * "está vacío" ANTES de insertar nada, así que en una instalación ya existente con datos
 * reales (`accounts` no vacío) esto no toca nada — solo añade la fila de `profile`, que es
 * una tabla nueva y por tanto siempre vacía la primera vez que corre esta migración.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DO $$
    DECLARE
      is_fresh boolean;
    BEGIN
      SELECT NOT EXISTS (SELECT 1 FROM accounts) INTO is_fresh;

      IF is_fresh THEN
        INSERT INTO accounts (name) VALUES ('Cuenta Nómina'), ('Cuenta Ahorro');

        INSERT INTO incomes (account, label, monthly_amount, property)
        VALUES ('Cuenta Nómina', 'Sueldo Neto mensual', 2000, NULL);

        INSERT INTO properties (name, estimated_value)
        VALUES ('Piso alquilado', 120000);

        INSERT INTO expenses (category, account, property, label, monthly_amount)
        VALUES
          ('Fijos', 'Cuenta Nómina', NULL, 'Alquiler', 700),
          ('Variables', 'Cuenta Nómina', NULL, 'Ocio', 150);

        INSERT INTO debts (name, monthly_payment, due_date, remaining_balance, balance_as_of)
        VALUES ('Préstamo coche', 150, '2028-01', 3000, NULL);

        INSERT INTO transfers (from_account, to_account, monthly_amount)
        VALUES ('Cuenta Nómina', 'Cuenta Ahorro', 200);

        INSERT INTO savings_trackers (kind, name, account, initial_balance, initial_balance_as_of)
        VALUES ('emergency_fund', 'Fondo de emergencia', 'Cuenta Ahorro', 500, '2026-01');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM profile) THEN
        INSERT INTO profile (name, birth_date, emergency_fund_target_months)
        VALUES ('Tu nombre', '1990-01-01', 3);
      END IF;
    END $$;
  `);
}

/** No se deshace: revertir borraría datos reales que el usuario ya haya metido encima de los de ejemplo. */
export async function down(): Promise<void> {}
