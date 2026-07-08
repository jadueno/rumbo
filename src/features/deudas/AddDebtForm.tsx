import { useState } from "react";
import type { NewDebt } from "../../domain/types";
import { Card } from "../../components/Card";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

export function AddDebtForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (debt: NewDebt) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [remainingBalance, setRemainingBalance] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          setError(null);
          try {
            await onSubmit({
              name,
              monthlyPayment: Number(monthlyPayment),
              dueDate,
              remainingBalance: remainingBalance === "" ? undefined : remainingBalance,
              balanceAsOf: remainingBalance === "" ? undefined : new Date().toISOString().slice(0, 7),
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se ha podido guardar la deuda");
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
              className={inputClass}
            />
          </Field>
          <Field label="Cuota mensual (€)">
            <input
              required
              type="number"
              min={0}
              step={0.01}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Hasta">
            <input
              required
              type="month"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Saldo pendiente (€, opcional)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={remainingBalance}
              onChange={(e) => setRemainingBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        {error && (
          <p className="text-xs" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" tone="ink" className="self-start" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar deuda"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

