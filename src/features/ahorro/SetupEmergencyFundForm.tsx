import { useState } from "react";
import type { NewSavingsTracker } from "../../domain/types";
import { Field } from "../../components/Field";

export function SetupEmergencyFundForm({
  accountNames,
  onSubmit,
}: {
  accountNames: string[];
  onSubmit: (tracker: NewSavingsTracker) => Promise<void>;
}) {
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [initialBalance, setInitialBalance] = useState<number | "">(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
          await onSubmit({
            kind: "emergency_fund",
            name: "Fondo de emergencia",
            account,
            initialBalance: Number(initialBalance),
            initialBalanceAsOf: new Date().toISOString().slice(0, 7),
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido configurar el fondo de emergencia");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Dinos en qué cuenta lo estás guardando y a partir de ahora se irá sumando solo, mes a mes, según lo
        que entre en esa cuenta.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="¿En qué cuenta lo guardas?">
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
        <Field label="¿Cuánto tienes ya ahorrado? (0 si empiezas de cero)">
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
      <button
        type="submit"
        disabled={submitting || accountNames.length === 0}
        className="self-start rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--series-savings)" }}
      >
        {submitting ? "Guardando…" : "Empezar a seguir el fondo de emergencia"}
      </button>
      {accountNames.length === 0 && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          Primero crea una cuenta en "Ingresos y Gastos".
        </p>
      )}
    </form>
  );
}
