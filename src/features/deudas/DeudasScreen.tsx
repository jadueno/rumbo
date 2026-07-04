import type { FinancialProfile } from "../../domain/types";
import {
  estimatedRemainingBalance,
  formatEUR,
  totalEstimatedRemainingDebt,
  totalMonthlyDebtPayments,
  totalMonthlyIncome,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { useLiveIncomes } from "../gastos/useLiveIncomes";

export function DeudasScreen({ profile: baseProfile }: { profile: FinancialProfile }) {
  const [profile] = useLiveIncomes(baseProfile);
  const totalPayments = totalMonthlyDebtPayments(profile);
  const income = totalMonthlyIncome(profile);
  const debtLoad = income > 0 ? totalPayments / income : 0;
  const totalRemaining = totalEstimatedRemainingDebt(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Deudas</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">
          <strong className="font-bold text-[var(--text-primary)]">{formatEUR(totalPayments)}</strong>/mes en
          cuotas · <strong className="font-bold text-[var(--text-primary)]">{Math.round(debtLoad * 100)}%</strong>{" "}
          de tus ingresos
        </p>
      </div>

      {profile.debts.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">No tienes deudas registradas.</p>
        </Card>
      ) : (
        <>
          <Card
            style={{
              borderWidth: 2,
              borderColor: "var(--series-expense)",
              backgroundColor: "color-mix(in srgb, var(--series-expense) 10%, var(--surface-1))",
            }}
          >
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saldo pendiente total (estimado)</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Se recalcula solo cada vez que abres la app, restando las cuotas de los meses transcurridos
              desde el último dato real. No cuenta intereses.
            </p>
            <p
              className="mt-3 text-4xl font-bold tabular-nums"
              style={{ color: "var(--series-expense)" }}
            >
              {formatEUR(totalRemaining)}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {profile.debts.map((debt) => {
              const estimated = estimatedRemainingBalance(debt);
              return (
                <Card key={debt.name} className="flex flex-col gap-2">
                  <h2 className="font-semibold text-[var(--text-primary)]">{debt.name}</h2>
                  <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                    {debt.monthlyPayment ? formatEUR(debt.monthlyPayment) : "—"}
                    <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
                  </p>
                  <dl className="mt-1 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Hasta</dt>
                      <dd className="font-medium text-[var(--text-secondary)]">{debt.dueDate}</dd>
                    </div>
                    {estimated !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--text-muted)]">Saldo pendiente (estimado)</dt>
                        <dd className="font-bold text-[var(--text-primary)]">{formatEUR(estimated)}</dd>
                      </div>
                    )}
                    {debt.balanceAsOf && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Partiendo del dato de {formatMonth(debt.balanceAsOf)}
                      </p>
                    )}
                  </dl>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}
