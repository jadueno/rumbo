import { useState } from "react";
import type { ExpenseGroup, NewExpenseItem, Property } from "../../domain/types";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

const categories: { value: ExpenseGroup; label: string }[] = [
  { value: "Fijos", label: "Obligatorio" },
  { value: "Variables", label: "Opcional" },
];

export function AddExpenseForm({
  accountNames,
  properties,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  properties: Property[];
  onSubmit: (expense: NewExpenseItem) => Promise<void>;
  onCancel: () => void;
}) {
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [category, setCategory] = useState<ExpenseGroup>("Fijos");
  const [property, setProperty] = useState("");
  const [propertyId, setPropertyId] = useState("");
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
          await onSubmit({
            account,
            group: category,
            property: property || undefined,
            propertyId: propertyId || undefined,
            label,
            monthlyAmount: Number(monthlyAmount),
          });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido guardar el gasto");
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
        <Field label="Categoría">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseGroup)}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vincular a una propiedad (opcional)">
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass}>
            <option value="">Ninguna</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nota (opcional)">
          <input
            value={property}
            onChange={(e) => setProperty(e.target.value)}
            className={inputClass}
          />
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
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" tone="ink" disabled={submitting || accountNames.length === 0}>
          {submitting ? "Guardando…" : "Guardar gasto"}
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
