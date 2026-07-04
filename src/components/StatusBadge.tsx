import type { Recommendation } from "../domain/calculations";

const config: Record<
  Recommendation["severity"],
  { label: string; color: string; icon: string }
> = {
  alta: { label: "Alta", color: "var(--status-critical)", icon: "!" },
  media: { label: "Media", color: "var(--status-warning)", icon: "!" },
  baja: { label: "Baja", color: "var(--status-good)", icon: "✓" },
};

export function SeverityBadge({ severity }: { severity: Recommendation["severity"] }) {
  const { label, color, icon } = config[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      <span aria-hidden="true">{icon}</span>
      Prioridad {label}
    </span>
  );
}
