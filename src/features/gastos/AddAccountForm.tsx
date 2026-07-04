import { useState } from "react";
import type { NewAccount } from "../../domain/types";
import { Field } from "../../components/Field";

export function AddAccountForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (account: NewAccount) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
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
          await onSubmit({ name });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido crear la cuenta");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Field label="Nombre de la cuenta">
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
        />
      </Field>
      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--series-income)" }}
        >
          {submitting ? "Guardando…" : "Guardar cuenta"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)]">
          Cancelar
        </button>
      </div>
    </form>
  );
}
