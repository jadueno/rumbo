import { useState } from "react";
import type { Profile } from "../../domain/types";
import { calculateAge } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { Field, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Perfil</h1>
        <p className="text-base font-normal text-[var(--text-secondary)]">
          Tu nombre y fecha de nacimiento se usan para calcular tu edad, que entra en el patrimonio recomendado
          del Resumen.
        </p>
      </div>

      <Card className="max-w-md">
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
      </Card>
    </div>
  );
}
