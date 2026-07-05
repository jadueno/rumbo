import type { FinancialHealthScore } from "../domain/calculations";
import { Card } from "./Card";
import { ScoreGauge } from "./ScoreGauge";
import { ProgressBar } from "./ProgressBar";

function toneColorForScore(score: number): string {
  if (score >= 70) return "var(--status-good)";
  if (score >= 40) return "var(--status-warning)";
  return "var(--status-critical)";
}

/** Score de salud financiera 0-100 con desglose explicable por factor (nunca una caja negra). */
export function FinancialHealthCard({
  title = "Score de salud financiera",
  healthScore,
}: {
  title?: string;
  healthScore: FinancialHealthScore;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <ScoreGauge score={healthScore.score} />
        <div className="flex w-full flex-col gap-3">
          {healthScore.factors.map((factor) => (
            <div key={factor.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-[var(--text-primary)]">{factor.label}</span>
                <span className="font-semibold tabular-nums text-[var(--text-muted)]">{factor.score}/100</span>
              </div>
              <ProgressBar progress={factor.score / 100} color={toneColorForScore(factor.score)} label={factor.label} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
