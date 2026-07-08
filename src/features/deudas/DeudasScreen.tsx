import { useState } from "react";
import type { FinancialProfile, NewDebt } from "../../domain/types";
import {
  estimatedRemainingBalance,
  formatEUR,
  formatMonth,
  totalEstimatedRemainingDebt,
  totalMonthlyDebtPayments,
  totalMonthlyIncome,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { focusRing } from "../../components/Field";
import { useConfirm } from "../../components/ConfirmProvider";
import { AddDebtForm } from "./AddDebtForm";

export function DeudasScreen({
  profile,
  onAddDebt,
  onRemoveDebt,
}: {
  profile: FinancialProfile;
  onAddDebt: (debt: NewDebt) => Promise<void>;
  onRemoveDebt: (id: string) => Promise<void>;
}) {
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);

  async function handleRemove(name: string, id: string) {
    if (await confirm(`¿Eliminar la deuda "${name}"? Esta acción no se puede deshacer.`)) {
      await onRemoveDebt(id);
    }
  }
  const totalPayments = totalMonthlyDebtPayments(profile);
  const income = totalMonthlyIncome(profile);
  const debtLoad = income > 0 ? totalPayments / income : 0;
  const totalRemaining = totalEstimatedRemainingDebt(profile);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Deudas</h1>
          <p className="text-base font-normal text-[var(--text-secondary)]">
            <strong className="font-bold text-[var(--text-primary)]">{formatEUR(totalPayments)}</strong>/mes en
            cuotas · <strong className="font-bold text-[var(--text-primary)]">{Math.round(debtLoad * 100)}%</strong>{" "}
            de tus ingresos
          </p>
        </div>
        <Button tone={showForm ? "neutral" : "ink"} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Añadir deuda"}
        </Button>
      </div>

      {showForm && (
        <AddDebtForm
          onSubmit={async (debt) => {
            await onAddDebt(debt);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

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
              backgroundColor: "color-mix(in srgb, var(--series-expense) 8%, var(--surface-1))",
            }}
          >
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saldo pendiente total (estimado)</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Se recalcula solo cada vez que abres la app, restando las cuotas de los meses transcurridos
              desde el último dato real. No cuenta intereses.
            </p>
            <p
              className="mt-3 text-4xl font-extrabold tabular-nums"
              style={{ color: "var(--series-expense)" }}
            >
              {formatEUR(totalRemaining)}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {profile.debts.map((debt) => {
              const estimated = estimatedRemainingBalance(debt);
              return (
                <Card key={debt.id} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-[var(--text-primary)]">{debt.name}</h2>
                    <button
                      type="button"
                      onClick={() => handleRemove(debt.name, debt.id)}
                      aria-label={`Eliminar deuda ${debt.name}`}
                      className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--status-critical)] ${focusRing}`}
                    >
                      Eliminar
                    </button>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                    {debt.monthlyPayment ? formatEUR(debt.monthlyPayment) : "—"}
                    <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
                  </p>
                  <dl className="mt-1 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Hasta</dt>
                      <dd className="font-medium text-[var(--text-secondary)]">{formatMonth(debt.dueDate)}</dd>
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
