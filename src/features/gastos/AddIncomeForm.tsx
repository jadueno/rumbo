import { useState } from "react";
import type { NewIncomeSource } from "../../domain/types";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

export function AddIncomeForm({
  accountNames,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  onSubmit: (income: NewIncomeSource) => Promise<void>;
  onCancel: () => void;
}) {
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [property, setProperty] = useState("");
  const [label, setLabel] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-[var(--gridline)] pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
          await onSubmit({ account, label, monthlyAmount: Number(monthlyAmount), property: property || undefined });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido guardar el ingreso");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Cuenta">
          <select
            required
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Elige una cuenta
            </option>
            {accountNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Concepto">
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Importe mensual (€)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Propiedad (opcional, p. ej. un alquiler)">
          <input value={property} onChange={(e) => setProperty(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" tone="ink" disabled={submitting || accountNames.length === 0}>
          {submitting ? "Guardando…" : "Guardar ingreso"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
      {accountNames.length === 0 && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          Primero crea una cuenta.
        </p>
      )}
    </form>
  );
}
