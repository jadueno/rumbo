import type { FinancialProfile } from "../../domain/types";
import { formatEUR, totalMonthlyDebtPayments, totalMonthlyIncome } from "../../domain/calculations";
import { Card } from "../../components/Card";

export function DeudasScreen({ profile }: { profile: FinancialProfile }) {
  const totalPayments = totalMonthlyDebtPayments(profile);
  const income = totalMonthlyIncome(profile);
  const debtLoad = income > 0 ? totalPayments / income : 0;

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
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.debts.map((debt) => (
            <Card key={debt.name} className="flex flex-col gap-2">
              <h2 className="font-semibold text-[var(--text-primary)]">{debt.name}</h2>
              <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {formatEUR(debt.monthlyPayment)}
                <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
              </p>
              <dl className="mt-1 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Hasta</dt>
                  <dd className="font-medium text-[var(--text-secondary)]">{debt.dueDate}</dd>
                </div>
                {debt.remainingBalance !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-muted)]">Saldo pendiente</dt>
                    <dd className="font-medium text-[var(--text-secondary)]">
                      {formatEUR(debt.remainingBalance)}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
