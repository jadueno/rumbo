import { useState } from "react";
import type { NewTransfer } from "../../domain/types";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

export function AddTransferForm({
  accountNames,
  defaultFromAccount,
  onSubmit,
  onCancel,
}: {
  accountNames: string[];
  /** Al abrir desde una cuenta concreta: precarga "Desde" con esa cuenta. */
  defaultFromAccount?: string;
  onSubmit: (transfer: NewTransfer) => Promise<void>;
  onCancel: () => void;
}) {
  const [fromAccount, setFromAccount] = useState(defaultFromAccount ?? accountNames[0] ?? "");
  const [toAccount, setToAccount] = useState(
    accountNames.find((a) => a !== (defaultFromAccount ?? accountNames[0])) ?? accountNames[0] ?? "",
  );
  const [monthlyAmount, setMonthlyAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sameAccount = fromAccount !== "" && fromAccount === toAccount;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (sameAccount) {
          setError("El origen y el destino no pueden ser la misma cuenta.");
          return;
        }
        setSubmitting(true);
        setError(null);
        try {
          await onSubmit({ fromAccount, toAccount, monthlyAmount: Number(monthlyAmount) });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido guardar la transferencia");
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
        <Field label="Hasta">
          <select
            required
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
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
        <Button type="submit" tone="ink" disabled={submitting || accountNames.length === 0 || sameAccount}>
          {submitting ? "Guardando…" : "Guardar transferencia"}
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
