import type { FinancialProfile, ExpenseGroup } from "./types";

export function totalMonthlyIncome(profile: FinancialProfile): number {
  return sum(profile.incomes.map((i) => i.monthlyAmount));
}

export function totalMonthlyExpenses(profile: FinancialProfile): number {
  return sum(profile.expenses.map((e) => e.monthlyAmount));
}

export function expensesByGroup(
  profile: FinancialProfile,
): Record<ExpenseGroup, number> {
  const groups: Record<ExpenseGroup, number> = {
    Fijos: 0,
    Variables: 0,
    Autónomo: 0,
  };
  for (const e of profile.expenses) groups[e.group] += e.monthlyAmount;
  return groups;
}

export function expensesByProperty(
  profile: FinancialProfile,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of profile.expenses) {
    const key = e.property ?? "General";
    result[key] = (result[key] ?? 0) + e.monthlyAmount;
  }
  return result;
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
