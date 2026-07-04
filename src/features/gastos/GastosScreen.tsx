import type { FinancialProfile } from "../../domain/types";
import {
  expensesByGroup,
  expensesByProperty,
  formatEUR,
  totalMonthlyExpenses,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { CategoryBreakdown } from "../../components/CategoryBreakdown";

export function GastosScreen({ profile }: { profile: FinancialProfile }) {
  const total = totalMonthlyExpenses(profile);
  const byGroup = expensesByGroup(profile);
  const byProperty = expensesByProperty(profile);

  const groupOrder = ["Fijos", "Variables", "Autónomo"] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Gastos</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Todo lo que te queda por pagar cada mes: {formatEUR(total)} en total.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CategoryBreakdown title="Por tipo de gasto" data={byGroup} />
        </Card>
        <Card>
          <CategoryBreakdown title="Por inmueble / destino" data={byProperty} />
        </Card>
      </div>

      {groupOrder.map((group) => {
        const items = profile.expenses.filter((e) => e.group === group);
        if (items.length === 0) return null;
        return (
          <Card key={group}>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Gastos {group.toLowerCase()}
            </h2>
            <table className="w-full text-sm">
              <caption className="sr-only">Detalle de gastos {group.toLowerCase()}</caption>
              <thead>
                <tr className="border-b border-[var(--gridline)] text-left text-[var(--text-muted)]">
                  <th scope="col" className="py-2 font-medium">Concepto</th>
                  <th scope="col" className="py-2 font-medium">Cuenta</th>
                  <th scope="col" className="py-2 text-right font-medium">Importe / mes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.label}-${i}`} className="border-b border-[var(--gridline)] last:border-0">
                    <td className="py-2.5 text-[var(--text-primary)]">
                      {item.label}
                      {item.property && item.property !== "General" ? (
                        <span className="ml-2 text-xs text-[var(--text-muted)]">({item.property})</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-[var(--text-secondary)]">{item.account}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium text-[var(--text-primary)]">
                      {formatEUR(item.monthlyAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
