import { useState } from "react";
import type { NewProperty, Property } from "../../domain/types";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Property;
  onSubmit: (entity: NewProperty) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [estimatedValue, setEstimatedValue] = useState<number | "">(initial?.estimatedValue ?? "");
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
          await onSubmit({ name, estimatedValue: Number(estimatedValue) });
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido guardar la propiedad");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Valor estimado de mercado (€)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value === "" ? "" : Number(e.target.value))}
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
        <Button type="submit" tone="ink" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar propiedad"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
