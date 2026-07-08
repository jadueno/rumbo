import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

/** Tabla singleton: siempre exactamente una fila (creada por la migración de seed que sigue a esta). */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("profile", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    // text, no "date": igual que due_date/balance_as_of en el resto del esquema — evita que
    // `pg` lo parsee como objeto Date de JS (con hora y zona horaria) al leerlo.
    birth_date: { type: "text", notNull: true },
    emergency_fund_target_months: { type: "integer", notNull: true, default: 3 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("profile");
}
