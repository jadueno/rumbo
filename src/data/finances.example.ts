import type { FinancialProfile } from "../domain/types";

/**
 * Plantilla de ejemplo. Copia este archivo a `finances.ts` (ignorado por git)
 * y sustituye los valores por tus datos reales.
 */
export const financialProfile: FinancialProfile = {
  age: 30,
  incomes: [
    { account: "Cuenta Nómina", label: "Sueldo Neto mensual", monthlyAmount: 2000 },
  ],
  expenses: [
    { group: "Fijos", account: "Cuenta Nómina", property: "General", label: "Alquiler", monthlyAmount: 700 },
    { group: "Variables", account: "Cuenta Nómina", property: "General", label: "Ocio", monthlyAmount: 150 },
  ],
  transfers: [
    { fromAccount: "Cuenta Nómina", toAccount: "Cuenta Ahorro", monthlyAmount: 200, isSavingsOrInvestment: true },
  ],
  accountFlows: [
    { account: "Cuenta Ahorro", entra: 200, sale: 0 },
    { account: "Cuenta Nómina", entra: 2000, sale: -1050 },
  ],
  debts: [
    { name: "Préstamo coche", monthlyPayment: 150, dueDate: "01/2028", remainingBalance: 3000 },
  ],
  emergencyFund: {
    targetMonths: 3,
    currentBalance: 500,
  },
};
