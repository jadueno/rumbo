import type { FinancialProfile } from "../../domain/types";
import {
  balanceByAccount,
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
  const accountBalances = balanceByAccount(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Gastos</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">
          Todo lo que te queda por pagar cada mes:{" "}
          <strong className="font-bold text-[var(--text-primary)]">{formatEUR(total)}</strong> en total.
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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Por cuenta bancaria</h2>
        <div className="flex flex-col gap-4">
          {accountBalances.map(({ account, income, expenses, balance }) => {
            const items = profile.expenses.filter((e) => e.account === account);
            const incomeItems = profile.incomes.filter((i) => i.account === account);
            if (items.length === 0 && incomeItems.length === 0) return null;

            const balanceColor =
              balance >= 0 ? "var(--series-savings)" : "var(--series-expense)";

            return (
              <Card key={account}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">{account}</h3>
                  <p className="text-xl font-bold tabular-nums" style={{ color: balanceColor }}>
                    {formatEUR(balance)}
                  </p>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-[var(--text-secondary)]">
                  <span>
                    Ingresos:{" "}
                    <strong className="font-bold text-[var(--text-primary)]">{formatEUR(income)}</strong>
                  </span>
                  <span>
                    Gastos:{" "}
                    <strong className="font-bold text-[var(--text-primary)]">{formatEUR(expenses)}</strong>
                  </span>
                </div>

                {incomeItems.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {incomeItems.map((i, idx) => (
                      <li key={`${i.label}-${idx}`} className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{i.label}</span>
                        <span
                          className="tabular-nums font-medium"
                          style={{ color: "var(--series-income)" }}
                        >
                          +{formatEUR(i.monthlyAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {items.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {items.map((item, idx) => (
                      <li key={`${item.label}-${idx}`} className="flex justify-between">
                        <span className="text-[var(--text-primary)]">
                          {item.label}
                          {item.property && item.property !== "General" ? (
                            <span className="ml-2 text-xs text-[var(--text-muted)]">({item.property})</span>
                          ) : null}
                        </span>
                        <span className="tabular-nums font-medium text-[var(--text-primary)]">
                          −{formatEUR(item.monthlyAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
