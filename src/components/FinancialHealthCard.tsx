import type { FinancialHealthScore } from "../domain/calculations";
import { Card } from "./Card";
import { ScoreGauge } from "./ScoreGauge";
import { FactorBreakdownList } from "./FactorBreakdownList";

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
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        <ScoreGauge score={healthScore.score} />
        <div className="w-full">
          <FactorBreakdownList factors={healthScore.factors} />
        </div>
      </div>
    </Card>
  );
}
