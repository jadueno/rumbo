import type { Account, FinancialProfile, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  buildRecommendations,
  currentEmergencyFundBalance,
  deliberateSavingsAndInvestment,
  emergencyFundProgress,
  emergencyFundTarget,
  formatEUR,
  netMonthlyCashflow,
  recommendedNetWorth,
  totalMonthlyExpenses,
  totalMonthlyIncome,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { BarComparison } from "../../components/BarComparison";
import { ProgressBar } from "../../components/ProgressBar";
import { SeverityBadge } from "../../components/StatusBadge";

export function ResumenScreen({
  profile,
  accounts,
  trackers,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
}) {
  const income = totalMonthlyIncome(profile);
  const expenses = totalMonthlyExpenses(profile);
  const savings = deliberateSavingsAndInvestment(profile);
  const net = netMonthlyCashflow(profile);
  const efTarget = emergencyFundTarget(profile);
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const efProgress = emergencyFundProgress(profile, efBalance);
  const topRecommendations = buildRecommendations(profile, efBalance)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Resumen</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">Cómo va tu economía este mes.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Ingresos, gastos y ahorro mensual
        </h2>
        <BarComparison
          items={[
            { label: "Ingresos", value: income, color: "var(--series-income)" },
            { label: "Gastos", value: expenses, color: "var(--series-expense)" },
            { label: "Ahorro e inversión", value: savings, color: "var(--series-savings)" },
          ]}
        />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Cashflow neto (ingresos − gastos):{" "}
          <span className="font-semibold text-[var(--text-primary)]">{formatEUR(net)}</span>/mes
        </p>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fondo de emergencia</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Objetivo: {profile.emergencyFund.targetMonths} meses de gastos ({formatEUR(efTarget)})
          </p>
          <div className="mt-3">
            <ProgressBar progress={efProgress} />
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {Math.round(efProgress * 100)}% completado
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Patrimonio neto recomendado</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Según tu edad ({profile.age} años) e ingresos anuales
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {formatEUR(recommendedNetWorth(profile))}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Fórmula de referencia: edad × ingreso anual / 10
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Qué deberías mirar</h2>
        <ul className="flex flex-col gap-3">
          {topRecommendations.map((rec) => (
            <li key={rec.title} className="flex flex-col gap-1.5 border-t border-[var(--gridline)] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">{rec.title}</span>
                <SeverityBadge severity={rec.severity} />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{rec.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function severityRank(severity: "alta" | "media" | "baja"): number {
  return { alta: 0, media: 1, baja: 2 }[severity];
}
