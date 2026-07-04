import type { Account, FinancialProfile, SavingsTracker } from "../../domain/types";
import { balanceByAccount, buildRecommendations, currentEmergencyFundBalance } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { SeverityBadge } from "../../components/StatusBadge";

const severityRank = { alta: 0, media: 1, baja: 2 } as const;

export function RecomendacionesScreen({
  profile,
  accounts,
  trackers,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
}) {
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const recommendations = [...buildRecommendations(profile, efBalance)].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Recomendaciones</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">
          Qué deberías mejorar, ordenado por prioridad.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.title} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--text-primary)]">{rec.title}</h2>
              <SeverityBadge severity={rec.severity} />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{rec.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
