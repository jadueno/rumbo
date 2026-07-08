import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * `property` (texto libre) seguía siendo una simple etiqueta comparada carácter a carácter
 * contra `properties.name` para calcular la rentabilidad por propiedad — frágil ante un typo
 * o una mayúscula distinta, y sin ninguna limpieza si la propiedad se borraba. Se añade
 * `property_id`, una FK real con `ON DELETE SET NULL`: el enlace se rompe solo si se borra la
 * propiedad, en vez de dejar una etiqueta huérfana. `property` se conserva tal cual como nota
 * libre independiente, sin relación con `properties`.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("incomes", {
    property_id: { type: "uuid", references: "properties", onDelete: "SET NULL" },
  });
  pgm.addColumn("expenses", {
    property_id: { type: "uuid", references: "properties", onDelete: "SET NULL" },
  });

  // Backfill best-effort: si el texto libre ya coincidía (sin distinguir mayúsculas ni
  // espacios) con una propiedad real, se establece el enlace de una vez.
  pgm.sql(`
    update incomes set property_id = p.id
    from properties p
    where incomes.property_id is null and lower(trim(incomes.property)) = lower(trim(p.name));
  `);
  pgm.sql(`
    update expenses set property_id = p.id
    from properties p
    where expenses.property_id is null and lower(trim(expenses.property)) = lower(trim(p.name));
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("expenses", "property_id");
  pgm.dropColumn("incomes", "property_id");
}
