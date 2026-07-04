import { useState } from "react";
import type { NewSavingsTracker } from "../../domain/types";
import { Field } from "../../components/Field";

export function AddInvestmentForm({
  accountNames,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  onSubmit: (tracker: NewSavingsTracker) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [initialBalance, setInitialBalance] = useState<number | "">(0);
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
            kind: "investment",
            name,
            account,
            initialBalance: Number(initialBalance),
            initialBalanceAsOf: new Date().toISOString().slice(0, 7),
          });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido crear la inversión");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nombre">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
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
        <Field label="Valor de partida (0 si empiezas de cero)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </Field>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || accountNames.length === 0}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--series-violet)" }}
        >
          {submitting ? "Guardando…" : "Guardar inversión"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)]">
          Cancelar
        </button>
      </div>
      {accountNames.length === 0 && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          Primero crea una cuenta en "Ingresos y Gastos".
        </p>
      )}
    </form>
  );
}
