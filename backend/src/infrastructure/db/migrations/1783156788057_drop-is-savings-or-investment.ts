import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

// Ya no lo lee ningún cálculo (savingsRate/deliberateSavingsAndInvestment se
// basan ahora en los SavingsTracker reales) y ningún formulario lo pone a
// true: era dato muerto.
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("transfers", "is_savings_or_investment");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("transfers", {
    is_savings_or_investment: { type: "boolean", notNull: true, default: false },
  });
}
