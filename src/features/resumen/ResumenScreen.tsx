import { useState } from "react";
import type { Account, FinancialProfile, Profile, Property, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  buildRecommendations,
  currentEmergencyFundBalance,
  financialHealthScore,
  formatEUR,
  netMonthlyCashflow,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { RecommendationTimeline } from "../../components/RecommendationTimeline";
import { FinancialHealthCard } from "../../components/FinancialHealthCard";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { ProfileIcon, InfoIcon } from "../../components/icons";
import { ProfileScreen } from "../perfil/ProfileScreen";
import { AboutRumboContent } from "./AboutRumboContent";

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
  const [showAbout, setShowAbout] = useState(false);
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const net = netMonthlyCashflow(profile);
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const healthScore = financialHealthScore(profile, accountBalances, trackers, efBalance);
  const recommendations = buildRecommendations(profile, efBalance, accountBalances, trackers, properties).sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 py-4 sm:py-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Resumen</h1>
          <p className="text-base font-normal text-[var(--text-secondary)]">
            {rawProfile?.name ? `Hola ${rawProfile.name}, así` : "Así"} va tu economía este mes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="tint" tone="ink" size="sm" onClick={() => setShowAbout(true)}>
            <InfoIcon className="size-4 shrink-0" />
            ¿Qué es Rumbo?
          </Button>
          <Button variant="tint" tone="ink" size="sm" onClick={() => setShowProfile(true)}>
            <ProfileIcon className="size-4 shrink-0" />
            Perfil
          </Button>
        </div>
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
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Qué deberías mirar</h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Todo en orden por ahora: no tenemos ninguna recomendación pendiente para ti.
          </p>
        ) : (
          <RecommendationTimeline items={recommendations} />
        )}
      </Card>

      {showProfile && rawProfile && (
        <Modal
          title="Perfil"
          description="Tu nombre y fecha de nacimiento se usan para calcular tu edad, que entra en el cálculo del patrimonio neto recomendado."
          onClose={() => setShowProfile(false)}
        >
          <ProfileScreen profile={rawProfile} onUpdateProfile={onUpdateProfile} />
        </Modal>
      )}

      {showAbout && (
        <Modal title="¿Qué es Rumbo?" onClose={() => setShowAbout(false)}>
          <AboutRumboContent />
        </Modal>
      )}
    </div>
  );
}

function severityRank(severity: "alta" | "media" | "baja"): number {
  return { alta: 0, media: 1, baja: 2 }[severity];
}
