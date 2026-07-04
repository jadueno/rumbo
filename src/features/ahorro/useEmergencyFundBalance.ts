import { useState } from "react";

const STORAGE_KEY = "emergencyFundBalance";

export function useEmergencyFundBalance(defaultValue: number) {
  const [balance, setBalance] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? Number(stored) : defaultValue;
  });

  function updateBalance(value: number) {
    setBalance(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  return [balance, updateBalance] as const;
}
