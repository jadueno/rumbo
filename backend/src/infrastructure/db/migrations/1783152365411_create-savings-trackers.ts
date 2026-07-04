import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("savings_trackers", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    kind: { type: "text", notNull: true, check: "kind in ('emergency_fund', 'investment')" },
    name: { type: "text", notNull: true },
    account: { type: "text", notNull: true },
    initial_balance: { type: "numeric(12,2)", notNull: true, default: 0 },
    initial_balance_as_of: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  // Como mucho un fondo de emergencia (las inversiones sí pueden ser varias).
  pgm.createIndex("savings_trackers", "kind", {
    unique: true,
    where: "kind = 'emergency_fund'",
    name: "savings_trackers_single_emergency_fund",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("savings_trackers");
}
