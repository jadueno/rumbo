import type { Debt, FinancialProfile } from "./types";

export function totalMonthlyIncome(profile: FinancialProfile): number {
  return sum(profile.incomes.map((i) => i.monthlyAmount));
}

export function totalMonthlyExpenses(profile: FinancialProfile): number {
  return sum(profile.expenses.map((e) => e.monthlyAmount));
}

export interface AccountBalance {
  account: string;
  income: number;
  expenses: number;
  balance: number;
}

/** Ingresos, gastos y balance agrupados por cuenta bancaria, en el orden en que aparecen las cuentas en el perfil. */
export function balanceByAccount(profile: FinancialProfile): AccountBalance[] {
  const accounts: string[] = [];
  for (const a of profile.accountFlows) if (!accounts.includes(a.account)) accounts.push(a.account);
  for (const i of profile.incomes) if (!accounts.includes(i.account)) accounts.push(i.account);
  for (const e of profile.expenses) if (!accounts.includes(e.account)) accounts.push(e.account);

  return accounts.map((account) => {
    const income = sum(profile.incomes.filter((i) => i.account === account).map((i) => i.monthlyAmount));
    const expenses = sum(profile.expenses.filter((e) => e.account === account).map((e) => e.monthlyAmount));
    return { account, income, expenses, balance: income - expenses };
  });
}

export function netMonthlyCashflow(profile: FinancialProfile): number {
  return totalMonthlyIncome(profile) - totalMonthlyExpenses(profile);
}

/** Dinero que va deliberadamente a ahorro o inversión: cuentas de ahorro y transferencias a productos de inversión/pensión */
export function deliberateSavingsAndInvestment(
  profile: FinancialProfile,
): number {
  const fromSavingsAccounts = sum(
    profile.accountFlows
      .filter((f) => savingsAccountNames.has(f.account))
      .map((f) => f.entra + f.sale),
  );
  const fromInvestmentTransfers = sum(
    profile.transfers
      .filter((t) => t.isSavingsOrInvestment && !isAccountName(profile, t.toAccount))
      .map((t) => t.monthlyAmount),
  );
  return fromSavingsAccounts + fromInvestmentTransfers;
}

/** Dinero que se acumula en cuentas corrientes sin destino definido (ni gasto ni inversión) */
export function idleSurplus(profile: FinancialProfile): number {
  return sum(
    profile.accountFlows
      .filter((f) => !savingsAccountNames.has(f.account))
      .map((f) => Math.max(0, f.entra + f.sale)),
  );
}

export function savingsRate(profile: FinancialProfile): number {
  const income = totalMonthlyIncome(profile);
  if (income === 0) return 0;
  return deliberateSavingsAndInvestment(profile) / income;
}

export function totalMonthlyDebtPayments(profile: FinancialProfile): number {
  return sum(profile.debts.map((d) => d.monthlyPayment));
}

/**
 * Saldo pendiente estimado a día de hoy: parte de `remainingBalance` en el mes
 * `balanceAsOf` y resta una cuota por cada mes completo transcurrido desde
 * entonces. Es una aproximación sin intereses ni cambios de cuota.
 */
export function estimatedRemainingBalance(debt: Debt, today: Date = new Date()): number | undefined {
  if (debt.remainingBalance === undefined || !debt.balanceAsOf) {
    return debt.remainingBalance;
  }
  const [asOfYear, asOfMonth] = debt.balanceAsOf.split("-").map(Number);
  const monthsElapsed =
    (today.getFullYear() - asOfYear) * 12 + (today.getMonth() + 1 - asOfMonth);
  return Math.max(0, debt.remainingBalance - Math.max(0, monthsElapsed) * debt.monthlyPayment);
}

export function totalEstimatedRemainingDebt(profile: FinancialProfile, today: Date = new Date()): number {
  return sum(
    profile.debts
      .map((d) => estimatedRemainingBalance(d, today))
      .filter((v): v is number => v !== undefined),
  );
}

export function recommendedNetWorth(profile: FinancialProfile): number {
  const annualIncome = totalMonthlyIncome(profile) * 12;
  // Fórmula de Thomas Stanley (The Millionaire Next Door): Edad × Ingreso anual / 10
  return (profile.age * annualIncome) / 10;
}

export function emergencyFundTarget(profile: FinancialProfile): number {
  return profile.emergencyFund.targetMonths * totalMonthlyExpenses(profile);
}

export function emergencyFundProgress(profile: FinancialProfile): number {
  const target = emergencyFundTarget(profile);
  if (target === 0) return 1;
  return Math.min(1, profile.emergencyFund.currentBalance / target);
}

export interface Recommendation {
  severity: "alta" | "media" | "baja";
  title: string;
  detail: string;
}

export function buildRecommendations(profile: FinancialProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const idle = idleSurplus(profile);
  const income = totalMonthlyIncome(profile);
  const rate = savingsRate(profile);
  const efProgress = emergencyFundProgress(profile);

  if (idle > income * 0.2) {
    recs.push({
      severity: "alta",
      title: "Dinero acumulándose sin destino",
      detail: `Cada mes se quedan ${formatEUR(idle)} en cuentas corrientes sin invertir ni ahorrar de forma deliberada. Define un destino (fondo de emergencia, inversión) para que ese dinero trabaje.`,
    });
  }

  if (rate < 0.1) {
    recs.push({
      severity: "alta",
      title: "Tasa de ahorro/inversión baja",
      detail: `Solo el ${(rate * 100).toFixed(1)}% de los ingresos van a ahorro o inversión de forma planificada. Se recomienda al menos un 15-20%.`,
    });
  } else if (rate < 0.2) {
    recs.push({
      severity: "media",
      title: "Tasa de ahorro/inversión mejorable",
      detail: `El ${(rate * 100).toFixed(1)}% de los ingresos van a ahorro o inversión. Está por debajo del 20% recomendado.`,
    });
  }

  if (efProgress < 1) {
    recs.push({
      severity: efProgress < 0.5 ? "alta" : "media",
      title: "Fondo de emergencia incompleto",
      detail: `El fondo de emergencia cubre el ${(efProgress * 100).toFixed(0)}% del objetivo de ${profile.emergencyFund.targetMonths} meses de gastos (${formatEUR(emergencyFundTarget(profile))}).`,
    });
  }

  const debtLoad = totalMonthlyDebtPayments(profile) / income;
  if (debtLoad > 0.35) {
    recs.push({
      severity: "alta",
      title: "Carga de deuda elevada",
      detail: `Las cuotas de deuda representan el ${(debtLoad * 100).toFixed(1)}% de los ingresos mensuales.`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      severity: "baja",
      title: "Salud financiera saludable",
      detail: "No se detectan señales de alerta relevantes en los datos actuales.",
    });
  }

  return recs;
}

const savingsAccountNames = new Set(["ING - Ahorro"]);

function isAccountName(profile: FinancialProfile, name: string): boolean {
  return profile.accountFlows.some((f) => f.account === name);
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
