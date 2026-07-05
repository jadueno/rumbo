import type { FinancialHealthFactor } from "../domain/calculations";
import { ProgressBar } from "./ProgressBar";

const FACTOR_DESCRIPTIONS: Record<FinancialHealthFactor["key"], string> = {
  savingsRate:
    "Qué parte de tus ingresos mensuales va a ahorro o inversión de forma deliberada (vinculada a un fondo de emergencia o inversión), no solo lo que sobra sin más. 20% o más de tus ingresos = 100 puntos; 0% = 0 puntos.",
  emergencyFund:
    "Cuánto cubre tu fondo de emergencia el objetivo de meses de gasto que te has marcado. Si ya lo tienes completo al 100% del objetivo = 100 puntos; si está a 0 = 0 puntos.",
  debtLoad:
    "Qué parte de tus ingresos mensuales se va en cuotas de deuda (préstamos, financiación). Sin deuda = 100 puntos; a partir de un 35% de tus ingresos en cuotas = 0 puntos.",
  idleSurplus:
    "Dinero que cada mes no va ni a gastos ni a un ahorro/inversión con destino, sobre tus ingresos. Si no se queda nada ocioso = 100 puntos; a partir de un 20% de tus ingresos sin destino = 0 puntos.",
};

function toneColorForScore(score: number): string {
  if (score >= 70) return "var(--status-good)";
  if (score >= 40) return "var(--status-warning)";
  return "var(--status-critical)";
}

/** Desglose por factor del score de salud financiera: barra + explicación de qué mide y cómo puntúa cada uno. */
export function FactorBreakdownList({ factors }: { factors: FinancialHealthFactor[] }) {
  return (
    <div className="flex flex-col gap-4">
      {factors.map((factor) => (
        <div key={factor.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-[var(--text-primary)]">{factor.label}</span>
            <span className="font-semibold tabular-nums text-[var(--text-muted)]">{factor.score}/100</span>
          </div>
          <ProgressBar progress={factor.score / 100} color={toneColorForScore(factor.score)} label={factor.label} />
          <p className="text-xs text-[var(--text-muted)]">
            {FACTOR_DESCRIPTIONS[factor.key]} Pesa un {Math.round(factor.weight * 100)}% del score.
          </p>
        </div>
      ))}
    </div>
  );
}
