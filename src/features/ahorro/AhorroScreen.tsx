import { useState } from "react";
import type { Account, FinancialProfile, NewSavingsTracker, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  currentEmergencyFundBalance,
  emergencyFundTarget,
  emergencyFundTracker,
  estimatedTrackerBalance,
  formatEUR,
  formatMonth,
  investmentTrackers,
  savingsRate,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { ProgressBar } from "../../components/ProgressBar";
import { useConfirm } from "../../components/ConfirmProvider";
import { SetupEmergencyFundForm } from "./SetupEmergencyFundForm";
import { AddInvestmentForm } from "./AddInvestmentForm";

interface Props {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
  onAddTracker: (tracker: NewSavingsTracker) => Promise<void>;
  onRemoveTracker: (id: string) => Promise<void>;
}

export function AhorroScreen({ profile, accounts, trackers, onAddTracker, onRemoveTracker }: Props) {
  const confirm = useConfirm();
  const [showAddInvestment, setShowAddInvestment] = useState(false);

  const accountNames = accounts.map((a) => a.name);
  const accountBalances = balanceByAccount(profile, accountNames);
  const rate = savingsRate(profile, accountBalances, trackers);

  const efTarget = emergencyFundTarget(profile);
  const efTrackerEntity = emergencyFundTracker(trackers);
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const efProgress = efTarget > 0 ? Math.min(1, efBalance / efTarget) : 1;

  const investments = investmentTrackers(trackers);

  async function handleRemoveTracker(name: string, id: string) {
    if (await confirm(`¿Dejar de seguir "${name}"? El histórico no se guarda, solo la configuración.`)) {
      await onRemoveTracker(id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ahorro e inversión</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">
          Tasa de ahorro/inversión:{" "}
          <strong className="font-bold text-[var(--text-primary)]">{Math.round(rate * 100)}%</strong> de tus
          ingresos.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fondo de emergencia</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Objetivo: {profile.emergencyFund.targetMonths} meses de gastos ({formatEUR(efTarget)}).
        </p>

        {efTrackerEntity ? (
          <>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--series-savings)" }}>
                  {formatEUR(efBalance)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  En {efTrackerEntity.account} · partiendo de {formatEUR(efTrackerEntity.initialBalance)} en{" "}
                  {formatMonth(efTrackerEntity.initialBalanceAsOf)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTracker(efTrackerEntity.name, efTrackerEntity.id)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
              >
                Dejar de seguir
              </button>
            </div>
            <div className="mt-4">
              <ProgressBar progress={efProgress} />
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {Math.round(efProgress * 100)}% completado
              </p>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <SetupEmergencyFundForm accountNames={accountNames} onSubmit={onAddTracker} />
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Inversiones</h2>
          <button
            type="button"
            onClick={() => setShowAddInvestment((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--series-violet)" }}
          >
            {showAddInvestment ? "Cancelar" : "+ Añadir inversión"}
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Cada inversión suma sola, mes a mes, según lo que entre en la cuenta a la que está vinculada.
        </p>

        {showAddInvestment && (
          <AddInvestmentForm
            accountNames={accountNames}
            onSubmit={onAddTracker}
            onCancel={() => setShowAddInvestment(false)}
          />
        )}

        {investments.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Aún no tienes inversiones registradas.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {investments.map((tracker) => {
              const monthlyRate = accountBalances.find((a) => a.account === tracker.account)?.balance ?? 0;
              return (
                <div key={tracker.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{tracker.name}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveTracker(tracker.name, tracker.id)}
                      aria-label={`Eliminar inversión ${tracker.name}`}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
                    >
                      Eliminar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{tracker.account}</p>
                  <p className="mt-2 text-xl font-bold tabular-nums" style={{ color: "var(--series-violet)" }}>
                    {formatEUR(estimatedTrackerBalance(tracker, accountBalances))}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Partiendo de {formatEUR(tracker.initialBalance)} en {formatMonth(tracker.initialBalanceAsOf)}
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--series-savings)" }}>
                    +{formatEUR(monthlyRate)}/mes
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">¿Cuánto deberías guardar?</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Como referencia general (no es una norma fija, depende de tu situación): completa primero el{" "}
          <strong className="text-[var(--text-primary)]">fondo de emergencia</strong> (3-6 meses de gastos)
          antes de invertir de forma agresiva. Después, destina en total al menos un{" "}
          <strong className="text-[var(--text-primary)]">15-20% de tus ingresos</strong> a ahorro e inversión
          combinados — priorizando primero eliminar deuda cara, y luego repartiendo entre fondo de
          emergencia, inversión a largo plazo y objetivos concretos según lo que necesites.
        </p>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Ahora mismo destinas{" "}
          <strong className="font-bold text-[var(--text-primary)]">{Math.round(rate * 100)}%</strong> de tus
          ingresos a ahorro/inversión deliberados, y tu fondo de emergencia está al{" "}
          <strong className="font-bold text-[var(--text-primary)]">{Math.round(efProgress * 100)}%</strong>{" "}
          de su objetivo.
        </p>
      </Card>
    </div>
  );
}
