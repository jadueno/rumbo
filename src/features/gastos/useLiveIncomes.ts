import { useState } from "react";
import type { FinancialProfile } from "../../domain/types";

const STORAGE_KEY = "incomeOverrides";

function keyFor(account: string, label: string): string {
  return `${account}|${label}`;
}

function loadOverrides(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Devuelve el perfil financiero con los ingresos editados por el usuario
 * (persistidos en localStorage) ya aplicados, para que cualquier pantalla
 * que lo use recalcule todo automáticamente a partir del mismo dato.
 */
export function useLiveIncomes(
  profile: FinancialProfile,
): readonly [FinancialProfile, (account: string, label: string, value: number) => void] {
  const [overrides, setOverrides] = useState<Record<string, number>>(loadOverrides);

  function updateIncome(account: string, label: string, value: number) {
    const next = { ...overrides, [keyFor(account, label)]: value };
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const incomes = profile.incomes.map((i) => ({
    ...i,
    monthlyAmount: overrides[keyFor(i.account, i.label)] ?? i.monthlyAmount,
  }));

  return [{ ...profile, incomes }, updateIncome] as const;
}
