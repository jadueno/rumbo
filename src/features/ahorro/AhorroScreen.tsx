import type { FinancialProfile } from "../../domain/types";
import {
  deliberateSavingsAndInvestment,
  emergencyFundTarget,
  formatEUR,
  idleSurplus,
  savingsRate,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { ProgressBar } from "../../components/ProgressBar";
import { useEmergencyFundBalance } from "./useEmergencyFundBalance";
import { useLiveIncomes } from "../gastos/useLiveIncomes";

export function AhorroScreen({ profile: baseProfile }: { profile: FinancialProfile }) {
  const [profile] = useLiveIncomes(baseProfile);
  const deliberate = deliberateSavingsAndInvestment(profile);
  const idle = idleSurplus(profile);
  const rate = savingsRate(profile);
  const [balance, setBalance] = useEmergencyFundBalance(profile.emergencyFund.currentBalance);
  const target = emergencyFundTarget(profile);
  const progress = target > 0 ? Math.min(1, balance / target) : 1;

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

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Ahorro e inversión deliberados
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Dinero con un destino claro: cuenta de ahorro y aportaciones a inversión/pensión.
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums" style={{ color: "var(--series-savings)" }}>
            {formatEUR(deliberate)}
            <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dinero acumulado sin destino</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Se queda en cuentas corrientes sin invertir ni asignar a ahorro. No es "malo", pero no está
            trabajando para ti.
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums" style={{ color: "var(--series-expense)" }}>
            {formatEUR(idle)}
            <span className="text-sm font-normal text-[var(--text-muted)]"> /mes</span>
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fondo de emergencia</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Objetivo: {profile.emergencyFund.targetMonths} meses de gastos ({formatEUR(target)}). Este dato no
          venía en tu Excel — indica tu saldo actual para ver el progreso real.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:max-w-xs">
          <label htmlFor="ef-balance" className="text-sm font-medium text-[var(--text-primary)]">
            Saldo actual del fondo de emergencia
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ef-balance"
              type="number"
              min={0}
              step={50}
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--series-income)]"
            />
            <span className="text-sm text-[var(--text-muted)]">€</span>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar progress={progress} />
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {Math.round(progress * 100)}% completado
          </p>
        </div>
      </Card>
    </div>
  );
}
