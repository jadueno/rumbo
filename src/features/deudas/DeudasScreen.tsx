import type { FinancialProfile } from "../../domain/types";
import { formatEUR, totalMonthlyDebtPayments, totalMonthlyIncome } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { useDebtBalances } from "./useDebtBalances";

export function DeudasScreen({ profile }: { profile: FinancialProfile }) {
  const totalPayments = totalMonthlyDebtPayments(profile);
  const income = totalMonthlyIncome(profile);
  const debtLoad = income > 0 ? totalPayments / income : 0;
  const [balances, setBalance] = useDebtBalances(profile.debts);
  const totalRemaining = Object.values(balances).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Deudas</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {formatEUR(totalPayments)}/mes en cuotas · {Math.round(debtLoad * 100)}% de tus ingresos
        </p>
      </div>

      {profile.debts.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">No tienes deudas registradas.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saldo pendiente total</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Suma de los saldos de abajo. Actualízalos cuando tengas cifras nuevas (por ejemplo cada mes) y
              se guardan en este navegador.
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {formatEUR(totalRemaining)}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {profile.debts.map((debt) => (
              <Card key={debt.name} className="flex flex-col gap-2">
                <h2 className="font-semibold text-[var(--text-primary)]">{debt.name}</h2>
                <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatEUR(debt.monthlyPayment)}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Hasta</span>
                  <span className="font-medium text-[var(--text-secondary)]">{debt.dueDate}</span>
                </div>

                <label
                  htmlFor={`balance-${debt.name}`}
                  className="mt-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  Saldo pendiente
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`balance-${debt.name}`}
                    type="number"
                    min={0}
                    step={50}
                    value={balances[debt.name] ?? 0}
                    onChange={(e) => setBalance(debt.name, Number(e.target.value))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--series-income)]"
                  />
                  <span className="text-sm text-[var(--text-muted)]">€</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
