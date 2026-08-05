import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

// Se quita la pantalla "Historial" (por ahora, puede volver más adelante): ya
// no queda ningún caso de uso ni ruta que lea o escriba snapshots.
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("snapshots");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("snapshots", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    month: { type: "text", notNull: true, unique: true },
    net_worth: { type: "numeric(14,2)", notNull: true },
    savings_rate: { type: "numeric(6,4)", notNull: true },
    health_score: { type: "integer", notNull: true, check: "health_score >= 0 and health_score <= 100" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
}
