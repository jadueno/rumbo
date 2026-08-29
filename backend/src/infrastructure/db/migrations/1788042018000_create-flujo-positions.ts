import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

/** Tabla singleton (como `profile`): guarda dónde ha colocado el usuario cada bola del
 * diagrama de "Flujo de cuentas", como un único JSON indexado por id de nodo. `id`
 * boolean con "check (id)" garantiza que nunca haya más de una fila; a diferencia de
 * `profile`, no hace falta una migración de seed aparte — el propio backend crea la fila
 * la primera vez que se guarda una posición (upsert en el repositorio). */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("flujo_positions", {
    id: { type: "boolean", primaryKey: true, default: true },
    positions: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("flujo_positions", "flujo_positions_id_check", "check (id)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("flujo_positions");
}
