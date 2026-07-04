import { useState } from "react";
import type { NewDebt } from "../../domain/types";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";

export function AddDebtForm({ onSubmit }: { onSubmit: (debt: NewDebt) => Promise<void> }) {
  const [name, setName] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [remainingBalance, setRemainingBalance] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Card>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          try {
            await onSubmit({
              name,
              monthlyPayment,
              dueDate,
              remainingBalance: remainingBalance === "" ? undefined : remainingBalance,
              balanceAsOf: remainingBalance === "" ? undefined : new Date().toISOString().slice(0, 7),
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Nueva deuda</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </Field>
          <Field label="Cuota mensual (€)">
            <input
              required
              type="number"
              min={0}
              step={0.01}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </Field>
          <Field label="Hasta (MM/YYYY)">
            <input
              required
              placeholder="MM/AAAA"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </Field>
          <Field label="Saldo pendiente (€, opcional)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={remainingBalance}
              onChange={(e) => setRemainingBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--series-income)" }}
        >
          {submitting ? "Guardando…" : "Guardar deuda"}
        </button>
      </form>
    </Card>
  );
}

