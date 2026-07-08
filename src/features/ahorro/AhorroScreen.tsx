import { useState } from "react";
import type { Account, FinancialProfile, NewProperty, NewSavingsTracker, Property, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  currentEmergencyFundBalance,
  emergencyFundTarget,
  emergencyFundTracker,
  estimatedTrackerBalance,
  formatEUR,
  formatMonth,
  investmentTrackers,
  rentalProfitByProperty,
  savingsRate,
  totalPropertyValue,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { IconBadge } from "../../components/IconBadge";
import { SavingsIcon, IncomeIcon, HomeIcon } from "../../components/icons";
import { focusRing } from "../../components/Field";
import { ProgressBar } from "../../components/ProgressBar";
import { useConfirm } from "../../components/ConfirmProvider";
import { SetupEmergencyFundForm } from "./SetupEmergencyFundForm";
import { AddInvestmentForm } from "./AddInvestmentForm";
import { EditTrackerForm } from "./EditTrackerForm";
import { PropertyForm } from "./PropertyForm";

interface Props {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
  properties: Property[];
  onAddTracker: (tracker: NewSavingsTracker) => Promise<void>;
  onUpdateTracker: (id: string, tracker: NewSavingsTracker) => Promise<void>;
  onRemoveTracker: (id: string) => Promise<void>;
  onAddProperty: (property: NewProperty) => Promise<void>;
  onUpdateProperty: (id: string, property: NewProperty) => Promise<void>;
  onRemoveProperty: (id: string) => Promise<void>;
}

export function AhorroScreen({
  profile,
  accounts,
  trackers,
  properties,
  onAddTracker,
  onUpdateTracker,
  onRemoveTracker,
  onAddProperty,
  onUpdateProperty,
  onRemoveProperty,
}: Props) {
  const confirm = useConfirm();
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const accountNames = accounts.map((a) => a.name);
  const accountBalances = balanceByAccount(profile, accountNames);
  const rate = savingsRate(profile, accountBalances, trackers);

  const efTarget = emergencyFundTarget(profile);
  const efTrackerEntity = emergencyFundTracker(trackers);
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const efProgress = efTarget > 0 ? Math.min(1, efBalance / efTarget) : 1;

  const investments = investmentTrackers(trackers);
  const rentalProfits = rentalProfitByProperty(profile);

  async function handleRemoveTracker(name: string, id: string) {
    if (await confirm(`¿Dejar de seguir "${name}"? El histórico no se guarda, solo la configuración.`)) {
      await onRemoveTracker(id);
    }
  }

  async function handleRemoveProperty(name: string, id: string) {
    if (await confirm(`¿Eliminar la propiedad "${name}"? Esta acción no se puede deshacer.`)) {
      await onRemoveProperty(id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Ahorro e inversión
        </h1>
        <p className="text-base font-normal text-[var(--text-secondary)]">
          Tasa de ahorro/inversión:{" "}
          <strong className="font-bold text-[var(--text-primary)]">{Math.round(rate * 100)}%</strong> de tus
          ingresos.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <IconBadge icon={SavingsIcon} tone="savings" size="sm" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fondo de emergencia</h2>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTrackerId((v) => (v === efTrackerEntity.id ? null : efTrackerEntity.id))}
                  className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--text-primary)] ${focusRing}`}
                >
                  {editingTrackerId === efTrackerEntity.id ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveTracker(efTrackerEntity.name, efTrackerEntity.id)}
                  className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--status-critical)] ${focusRing}`}
                >
                  Dejar de seguir
                </button>
              </div>
            </div>
            {editingTrackerId === efTrackerEntity.id && (
              <EditTrackerForm
                tracker={efTrackerEntity}
                accountNames={accountNames}
                onSubmit={onUpdateTracker}
                onCancel={() => setEditingTrackerId(null)}
              />
            )}
            <div className="mt-4">
              <ProgressBar
                progress={efProgress}
                label={`Fondo de emergencia: ${Math.round(efProgress * 100)}% completado`}
              />
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <IconBadge icon={IncomeIcon} tone="violet" size="sm" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Inversiones</h2>
          </div>
          <Button tone="ink" size="sm" onClick={() => setShowAddInvestment((v) => !v)}>
            {showAddInvestment ? "Cancelar" : "+ Añadir inversión"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
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
                <div
                  key={tracker.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{tracker.name}</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingTrackerId((v) => (v === tracker.id ? null : tracker.id))}
                        className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--text-primary)] ${focusRing}`}
                      >
                        {editingTrackerId === tracker.id ? "Cerrar" : "Editar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTracker(tracker.name, tracker.id)}
                        aria-label={`Eliminar inversión ${tracker.name}`}
                        className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--status-critical)] ${focusRing}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{tracker.account}</p>
                  <p className="mt-2 text-xl font-bold tabular-nums" style={{ color: "var(--series-violet)" }}>
                    {formatEUR(estimatedTrackerBalance(tracker, accountBalances))}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Partiendo de {formatEUR(tracker.initialBalance)} en {formatMonth(tracker.initialBalanceAsOf)}
                  </p>
                  <p
                    className="mt-1 text-sm font-medium"
                    style={{ color: monthlyRate >= 0 ? "var(--series-savings)" : "var(--status-critical)" }}
                  >
                    {monthlyRate >= 0 ? "+" : ""}
                    {formatEUR(monthlyRate)}/mes
                  </p>
                  {editingTrackerId === tracker.id && (
                    <EditTrackerForm
                      tracker={tracker}
                      accountNames={accountNames}
                      onSubmit={onUpdateTracker}
                      onCancel={() => setEditingTrackerId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <IconBadge icon={HomeIcon} tone="expense" size="sm" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Propiedades</h2>
          </div>
          <Button tone="ink" size="sm" onClick={() => setShowAddProperty((v) => !v)}>
            {showAddProperty ? "Cancelar" : "+ Añadir propiedad"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Su valor de mercado suma a tu patrimonio. Si dan alquiler, vincula el ingreso y los gastos a esta propiedad
          (en "Ingresos y Gastos") para ver aquí el beneficio neto — esa renta ya cuenta como ingreso normal, no se
          vuelve a sumar al patrimonio.
        </p>

        {showAddProperty && <PropertyForm onSubmit={onAddProperty} onCancel={() => setShowAddProperty(false)} />}

        {properties.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Aún no tienes propiedades registradas.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {properties.map((property) => {
              const profit = rentalProfits.find((p) => p.propertyId === property.id);
              return (
                <div key={property.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{property.name}</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingPropertyId((v) => (v === property.id ? null : property.id))}
                        className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--text-primary)] ${focusRing}`}
                      >
                        {editingPropertyId === property.id ? "Cerrar" : "Editar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(property.name, property.id)}
                        aria-label={`Eliminar propiedad ${property.name}`}
                        className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--status-critical)] ${focusRing}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-bold tabular-nums text-[var(--text-primary)]">
                    {formatEUR(property.estimatedValue)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Valor estimado de mercado</p>
                  {profit && (
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{ color: profit.net >= 0 ? "var(--series-savings)" : "var(--status-critical)" }}
                    >
                      Alquiler neto: {profit.net >= 0 ? "+" : ""}
                      {formatEUR(profit.net)}/mes ({formatEUR(profit.income)} ingreso − {formatEUR(profit.expenses)}{" "}
                      gastos)
                    </p>
                  )}
                  {editingPropertyId === property.id && (
                    <PropertyForm
                      initial={property}
                      onSubmit={(entity) => onUpdateProperty(property.id, entity)}
                      onCancel={() => setEditingPropertyId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {properties.length > 0 && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Valor total de propiedades:{" "}
            <strong className="font-bold text-[var(--text-primary)]">{formatEUR(totalPropertyValue(properties))}</strong>
          </p>
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
