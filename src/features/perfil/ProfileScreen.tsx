import { useState } from "react";
import type { Profile } from "../../domain/types";
import { calculateAge } from "../../domain/calculations";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

/** Contenido del modal de Perfil (el título/descripción los pone el <Modal> que lo envuelve). */
export function ProfileScreen({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (entity: Profile) => Promise<void>;
}) {
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [emergencyFundTargetMonths, setEmergencyFundTargetMonths] = useState(profile.emergencyFundTargetMonths);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const age = birthDate ? calculateAge(birthDate) : null;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSaved(false);
        try {
          await onUpdateProfile({ name, birthDate, emergencyFundTargetMonths });
          setSaved(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se ha podido guardar el perfil");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Field label="Nombre">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Fecha de nacimiento">
        <input
          required
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClass}
        />
      </Field>
      {age !== null && !Number.isNaN(age) && (
        <p className="text-sm text-[var(--text-muted)]">Edad calculada: {age} años</p>
      )}

      <Field label="Objetivo del fondo de emergencia (meses de gasto)">
        <input
          required
          type="number"
          min={1}
          step={1}
          value={emergencyFundTargetMonths}
          onChange={(e) => setEmergencyFundTargetMonths(Number(e.target.value))}
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-xs" style={{ color: "var(--status-good)" }}>
          Perfil guardado.
        </p>
      )}

      <Button type="submit" tone="ink" className="self-start" disabled={submitting}>
        {submitting ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}
