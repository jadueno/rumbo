import { useState } from "react";
import type { ExpenseGroup, NewExpenseItem } from "../../domain/types";
import { Field } from "../../components/Field";

const categories: { value: ExpenseGroup; label: string }[] = [
  { value: "Fijos", label: "Obligatorio" },
  { value: "Variables", label: "Opcional" },
];

export function AddExpenseForm({
  accountNames,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  onSubmit: (expense: NewExpenseItem) => Promise<void>;
  onCancel: () => void;
}) {
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [category, setCategory] = useState<ExpenseGroup>("Fijos");
  const [property, setProperty] = useState("");
  const [label, setLabel] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-[var(--gridline)] pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          await onSubmit({ account, group: category, property: property || undefined, label, monthlyAmount });
          onCancel();
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
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
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
        <Field label="Categoría">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseGroup)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nota (opcional)">
          <input
            value={property}
            onChange={(e) => setProperty(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
        <Field label="Concepto">
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
        <Field label="Importe mensual (€)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || accountNames.length === 0}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--series-expense)" }}
        >
          {submitting ? "Guardando…" : "Guardar gasto"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)]">
          Cancelar
        </button>
      </div>
      {accountNames.length === 0 && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          Primero crea una cuenta.
        </p>
      )}
    </form>
  );
}
