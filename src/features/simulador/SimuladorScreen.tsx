import { useState } from "react";
import type { Account, FinancialProfile, SavingsTracker } from "../../domain/types";
import {
  balanceByAccount,
  currentEmergencyFundBalance,
  deliberateSavingsAndInvestment,
  financialHealthScore,
  netMonthlyCashflow,
  simulateAdjustments,
} from "../../domain/calculations";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { IconBadge } from "../../components/IconBadge";
import { ScoreGauge } from "../../components/ScoreGauge";
import { FactorBreakdownList } from "../../components/FactorBreakdownList";
import { BeforeAfterComparison } from "../../components/BeforeAfterComparison";
import { SimulatorIcon } from "../../components/icons";

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
          {value > 0 ? "+" : ""}
          {value} €
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--series-violet)]"
      />
    </label>
  );
}

export function SimuladorScreen({
  profile,
  accounts,
  trackers,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  trackers: SavingsTracker[];
}) {
  const [incomeDelta, setIncomeDelta] = useState(0);
  const [expensesDelta, setExpensesDelta] = useState(0);
  const [extraSavingsDelta, setExtraSavingsDelta] = useState(0);

  const accountBalances = balanceByAccount(
    profile,
    accounts.map((a) => a.name),
  );
  const efBalance = currentEmergencyFundBalance(trackers, accountBalances);

  const beforeNetCashflow = netMonthlyCashflow(profile);
  const beforeSavings = deliberateSavingsAndInvestment(accountBalances, trackers);
  const beforeHealthScore = financialHealthScore(profile, accountBalances, trackers, efBalance);

  const after = simulateAdjustments(profile, accountBalances, trackers, efBalance, {
    incomeDelta,
    expensesDelta,
    extraSavingsDelta,
  });

  const hasChanges = incomeDelta !== 0 || expensesDelta !== 0 || extraSavingsDelta !== 0;

  const reset = () => {
    setIncomeDelta(0);
    setExpensesDelta(0);
    setExtraSavingsDelta(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">Simulador</h1>
        <p className="text-base font-normal text-[var(--text-secondary)]">
          Qué pasaría si cambias tus números. Nada de esto se guarda, es solo una simulación.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={SimulatorIcon} tone="violet" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ajustes hipotéticos</h2>
          </div>
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Restablecer
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <SliderField
            label="Ajuste de ingresos mensuales"
            value={incomeDelta}
            onChange={setIncomeDelta}
            min={-10000}
            max={10000}
            step={50}
          />
          <SliderField
            label="Ajuste de gastos mensuales"
            value={expensesDelta}
            onChange={setExpensesDelta}
            min={-10000}
            max={10000}
            step={50}
          />
          <SliderField
            label="Aportación extra a ahorro/inversión"
            value={extraSavingsDelta}
            onChange={setExtraSavingsDelta}
            min={-10000}
            max={10000}
            step={50}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Score de salud financiera</h2>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:justify-start">
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={beforeHealthScore.score} size={104} />
            <span className="text-xs font-semibold text-[var(--text-muted)]">Ahora</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={after.healthScore.score} size={104} />
            <span className="text-xs font-semibold text-[var(--text-muted)]">Simulado</span>
          </div>
        </div>
        <div className="mt-6">
          <FactorBreakdownList factors={after.healthScore.factors} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Antes vs. después</h2>
        <BeforeAfterComparison
          items={[
            { label: "Cashflow neto mensual", before: beforeNetCashflow, after: after.netCashflow },
            { label: "Ahorro/inversión mensual", before: beforeSavings, after: after.deliberateSavings },
          ]}
        />
      </Card>
    </div>
  );
}
