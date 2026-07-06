import type { Account, FinancialProfile, NewSnapshot, Property, SavingsTracker, Snapshot } from "../../domain/types";
import {
  balanceByAccount,
  currentEmergencyFundBalance,
  currentNetWorth,
  financialHealthScore,
  formatEUR,
  savingsRate,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { IconBadge } from "../../components/IconBadge";
import { TrendIcon } from "../../components/icons";
import { focusRing } from "../../components/Field";
import { useConfirm } from "../../components/ConfirmProvider";
import { TrendChart } from "../../components/TrendChart";

// Mismos tonos de marca que el resto de la app (violet/savings/income), un 15%
// más oscuros solo para el trazo del gráfico: como línea fina sobre fondo oscuro
// necesitan menos luminosidad que como relleno de botón/badge con texto encima
// (validado con la skill de dataviz: script validate_palette.js, banda OKLCH
// L 0.48–0.67 en modo oscuro). Las variables CSS compartidas no se tocan.
const CHART_VIOLET = "color-mix(in srgb, var(--series-violet) 85%, black)";
const CHART_SAVINGS = "color-mix(in srgb, var(--series-savings) 85%, black)";
const CHART_INCOME = "color-mix(in srgb, var(--series-income) 85%, black)";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  const text = new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return text[0].toUpperCase() + text.slice(1);
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

interface Props {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
  properties: Property[];
  snapshots: Snapshot[];
  onAddSnapshot: (snapshot: NewSnapshot) => Promise<void>;
  onUpdateSnapshot: (id: string, snapshot: NewSnapshot) => Promise<void>;
  onRemoveSnapshot: (id: string) => Promise<void>;
}

export function HistorialScreen({
  profile,
  accounts,
  trackers,
  properties,
  snapshots,
  onAddSnapshot,
  onUpdateSnapshot,
  onRemoveSnapshot,
}: Props) {
  const confirm = useConfirm();

  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);
  const netWorth = currentNetWorth(profile, accountBalances, trackers, properties);
  const rate = savingsRate(profile, accountBalances, trackers);
  const score = financialHealthScore(profile, accountBalances, trackers, efBalance).score;

  const thisMonth = currentMonth();
  const existing = snapshots.find((s) => s.month === thisMonth);
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));

  async function handleSave() {
    const payload: NewSnapshot = { month: thisMonth, netWorth, savingsRate: rate, healthScore: score };
    if (existing) {
      await onUpdateSnapshot(existing.id, payload);
    } else {
      await onAddSnapshot(payload);
    }
  }

  async function handleRemove(snapshot: Snapshot) {
    if (await confirm(`¿Eliminar el snapshot de ${formatMonthLabel(snapshot.month)}? Esta acción no se puede deshacer.`)) {
      await onRemoveSnapshot(snapshot.id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Historial</h1>
        <p className="text-base font-normal text-[var(--text-secondary)]">
          Guarda una foto de tus números cada mes para ver cómo evolucionan, en vez de solo el dato de hoy.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Snapshot de {formatMonthLabel(thisMonth)}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Patrimonio {formatEUR(netWorth)} · Ahorro {formatPercent(rate)} · Score {score}/100
              {existing && " — ya guardado, puedes actualizarlo con los números de hoy"}
            </p>
          </div>
          <Button tone="violet" onClick={handleSave}>
            {existing ? "Actualizar snapshot de este mes" : "+ Guardar snapshot de este mes"}
          </Button>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Todavía no tienes ningún snapshot guardado. Guarda el de este mes para empezar a ver la evolución.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <div className="mb-3 flex items-center gap-2.5">
                <IconBadge icon={TrendIcon} tone="violet" size="sm" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Patrimonio</h2>
              </div>
              <TrendChart
                label="Patrimonio"
                points={sorted.map((s) => ({ month: s.month, value: s.netWorth }))}
                color={CHART_VIOLET}
                formatValue={formatEUR}
              />
            </Card>
            <Card>
              <div className="mb-3 flex items-center gap-2.5">
                <IconBadge icon={TrendIcon} tone="savings" size="sm" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tasa de ahorro</h2>
              </div>
              <TrendChart
                label="Tasa de ahorro"
                points={sorted.map((s) => ({ month: s.month, value: s.savingsRate }))}
                color={CHART_SAVINGS}
                formatValue={formatPercent}
              />
            </Card>
            <Card>
              <div className="mb-3 flex items-center gap-2.5">
                <IconBadge icon={TrendIcon} tone="income" size="sm" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Score de salud financiera</h2>
              </div>
              <TrendChart
                label="Score de salud financiera"
                points={sorted.map((s) => ({ month: s.month, value: s.healthScore }))}
                color={CHART_INCOME}
                formatValue={(v) => `${Math.round(v)}/100`}
              />
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Snapshots guardados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-[var(--text-muted)]">
                    <th className="pb-2 font-medium">Mes</th>
                    <th className="pb-2 font-medium">Patrimonio</th>
                    <th className="pb-2 font-medium">Tasa de ahorro</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().map((s) => (
                    <tr key={s.id} className="border-t border-[var(--gridline)]">
                      <td className="py-2 text-[var(--text-primary)]">{formatMonthLabel(s.month)}</td>
                      <td className="py-2 tabular-nums text-[var(--text-primary)]">{formatEUR(s.netWorth)}</td>
                      <td className="py-2 tabular-nums text-[var(--text-primary)]">{formatPercent(s.savingsRate)}</td>
                      <td className="py-2 tabular-nums text-[var(--text-primary)]">{s.healthScore}/100</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(s)}
                          aria-label={`Eliminar snapshot de ${formatMonthLabel(s.month)}`}
                          className={`rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] hover:text-[var(--status-critical)] ${focusRing}`}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
