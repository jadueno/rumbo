import type { Account, FinancialProfile, Property, SavingsTracker } from "../../domain/types";
import { balanceByAccount, buildRecommendations, currentEmergencyFundBalance } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { RecommendationTimeline } from "../../components/RecommendationTimeline";

const severityRank = { alta: 0, media: 1, baja: 2 } as const;

export function RecomendacionesScreen({
  profile,
  accounts,
  trackers,
  properties,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
  properties: Property[];
}) {
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const recommendations = [...buildRecommendations(profile, efBalance, accountBalances, trackers, properties)].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Recomendaciones
        </h1>
        <p className="text-base font-normal text-[var(--text-secondary)]">
          Qué deberías mejorar, ordenado por prioridad.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Todo en orden por ahora: no tenemos ninguna recomendación pendiente para ti.
          </p>
        </Card>
      ) : (
        <RecommendationTimeline items={recommendations} headingLevel="h2" />
      )}
    </div>
  );
}
