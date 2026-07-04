import { useState } from "react";
import type { Debt } from "../../domain/types";

const STORAGE_KEY = "debtRemainingBalances";

type Balances = Record<string, number>;

function loadStored(): Balances {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Saldos pendientes editables por el usuario, uno por deuda (clave = Debt.name), persistidos en localStorage. */
export function useDebtBalances(debts: Debt[]) {
  const [balances, setBalances] = useState<Balances>(() => {
    const stored = loadStored();
    const initial: Balances = {};
    for (const debt of debts) {
      initial[debt.name] = stored[debt.name] ?? debt.remainingBalance ?? 0;
    }
    return initial;
  });

  function updateBalance(name: string, value: number) {
    const next = { ...balances, [name]: value };
    setBalances(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return [balances, updateBalance] as const;
}
