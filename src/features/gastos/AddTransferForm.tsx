import { useState } from "react";
import type { NewTransfer } from "../../domain/types";
import { Field } from "../../components/Field";

export function AddTransferForm({
  accountNames,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  onSubmit: (transfer: NewTransfer) => Promise<void>;
  onCancel: () => void;
}) {
  const [fromAccount, setFromAccount] = useState(accountNames[0] ?? "");
  const [toAccount, setToAccount] = useState(accountNames[1] ?? accountNames[0] ?? "");
  const [monthlyAmount, setMonthlyAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-[var(--gridline)] pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          await onSubmit({ fromAccount, toAccount, monthlyAmount: Number(monthlyAmount), isSavingsOrInvestment: false });
          onCancel();
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Desde">
          <select
            required
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
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
        <Field label="Hasta">
          <select
            required
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
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
        <Field label="Importe mensual (€)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || accountNames.length === 0}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--series-violet)" }}
        >
          {submitting ? "Guardando…" : "Guardar transferencia"}
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
