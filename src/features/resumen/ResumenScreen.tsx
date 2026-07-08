import { useState } from "react";
import type { Account, FinancialProfile, Profile, Property, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  buildRecommendations,
  currentEmergencyFundBalance,
  currentNetWorth,
  deliberateSavingsAndInvestment,
  emergencyFundProgress,
  emergencyFundTarget,
  financialHealthScore,
  formatEUR,
  netMonthlyCashflow,
  recommendedNetWorth,
  totalMonthlyExpenses,
  totalMonthlyIncome,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { BarComparison } from "../../components/BarComparison";
import { ProgressBar } from "../../components/ProgressBar";
import { RecommendationTimeline } from "../../components/RecommendationTimeline";
import { IconBadge } from "../../components/IconBadge";
import { FinancialHealthCard } from "../../components/FinancialHealthCard";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { ExpenseIcon, SavingsIcon, TipIcon, ProfileIcon } from "../../components/icons";
import { ProfileScreen } from "../perfil/ProfileScreen";

export function ResumenScreen({
  profile,
  accounts,
  trackers,
  properties,
  rawProfile,
  onUpdateProfile,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
  properties: Property[];
  rawProfile: Profile | null;
  onUpdateProfile: (entity: Profile) => Promise<void>;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const income = totalMonthlyIncome(profile);
  const expenses = totalMonthlyExpenses(profile);
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const savings = deliberateSavingsAndInvestment(accountBalances, trackers);
  const net = netMonthlyCashflow(profile);
  const efTarget = emergencyFundTarget(profile);
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const efProgress = emergencyFundProgress(profile, efBalance);
  const healthScore = financialHealthScore(profile, accountBalances, trackers, efBalance);
  const netWorth = currentNetWorth(profile, accountBalances, trackers, properties);
  const netWorthTarget = recommendedNetWorth(profile);
  const topRecommendations = buildRecommendations(profile, efBalance, accountBalances, trackers, properties)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Resumen</h1>
          <p className="text-base font-normal text-[var(--text-secondary)]">
            {rawProfile?.name ? `Hola ${rawProfile.name}, así` : "Así"} va tu economía este mes.
          </p>
        </div>
        <Button variant="tint" tone="ink" size="sm" onClick={() => setShowProfile(true)}>
          <ProfileIcon className="size-4 shrink-0" />
          Perfil
        </Button>
      </div>

      {/* Hero: el dato más importante del mes, destacado en el acento de marca. */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--accent-yellow)] p-6 sm:p-8">
        <span aria-hidden="true" className="blob -top-12 -right-10 size-44 bg-[var(--accent-violet-blob)]" />
        <span aria-hidden="true" className="blob -bottom-16 left-6 size-28 bg-[var(--accent-violet-blob)]" />
        <div className="relative">
          <p className="text-sm font-semibold text-[var(--on-accent-yellow)]">Cashflow neto este mes</p>
          <p className="mt-2 text-4xl font-extrabold tabular-nums text-[var(--on-accent-yellow)] sm:text-5xl">
            {formatEUR(net)}
            <span className="ml-1 text-lg font-semibold">/mes</span>
          </p>
          {net !== 0 && (
            <span
              className="mt-4 inline-flex items-center rounded-full bg-[var(--surface-1)] px-3 py-1 text-sm font-bold shadow-card"
              style={{ color: net < 0 ? "var(--status-critical)" : "var(--status-good)" }}
            >
              {net < 0 ? "Te faltan" : "Te sobran"} {formatEUR(Math.abs(net))}
            </span>
          )}
        </div>
      </div>

      <FinancialHealthCard healthScore={healthScore} />

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <IconBadge icon={ExpenseIcon} tone="income" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Ingresos, gastos y ahorro mensual
          </h2>
        </div>
        <BarComparison
          items={[
            { label: "Ingresos", value: income, color: "var(--series-income)" },
            { label: "Gastos", value: expenses, color: "var(--series-expense)" },
            { label: "Ahorro e inversión", value: savings, color: "var(--series-savings)" },
          ]}
        />
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon={SavingsIcon} tone="savings" size="sm" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fondo de emergencia</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Objetivo: {profile.emergencyFund.targetMonths} meses de gastos ({formatEUR(efTarget)})
          </p>
          <div className="mt-3">
            <ProgressBar
              progress={efProgress}
              label={`Fondo de emergencia: ${Math.round(efProgress * 100)}% completado`}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {Math.round(efProgress * 100)}% completado
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon={TipIcon} tone="violet" size="sm" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Patrimonio neto</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Actual: seguimientos de ahorro/inversión + propiedades − deuda pendiente
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">
            {formatEUR(netWorth)}
          </p>
          {netWorthTarget > 0 && (
            <>
              <div className="mt-3">
                <ProgressBar
                  progress={netWorth / netWorthTarget}
                  color={netWorth >= netWorthTarget ? "var(--status-good)" : "var(--series-violet)"}
                  label={`Patrimonio: ${Math.round((netWorth / netWorthTarget) * 100)}% del recomendado para tu edad`}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {Math.round((netWorth / netWorthTarget) * 100)}% de {formatEUR(netWorthTarget)} recomendado para tu
                edad ({profile.age} años) e ingresos anuales (edad × ingreso anual / 10)
              </p>
            </>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Qué deberías mirar</h2>
        {topRecommendations.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Todo en orden por ahora: no tenemos ninguna recomendación pendiente para ti.
          </p>
        ) : (
          <RecommendationTimeline items={topRecommendations} />
        )}
      </Card>

      {showProfile && rawProfile && (
        <Modal
          title="Perfil"
          description="Tu nombre y fecha de nacimiento se usan para calcular tu edad, que entra en el patrimonio recomendado de aquí arriba."
          onClose={() => setShowProfile(false)}
        >
          <ProfileScreen profile={rawProfile} onUpdateProfile={onUpdateProfile} />
        </Modal>
      )}
    </div>
  );
}

function severityRank(severity: "alta" | "media" | "baja"): number {
  return { alta: 0, media: 1, baja: 2 }[severity];
}
