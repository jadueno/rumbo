import type { Debt, FinancialProfile, SavingsTracker } from "./types";

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
  transfersIn: number;
  transfersOut: number;
  balance: number;
}

/**
 * Ingresos, gastos, transferencias y balance agrupados por cuenta, en el
 * orden en que aparecen las cuentas en el perfil. El balance ya tiene en
 * cuenta las transferencias entre cuentas (una cuenta puede tener superávit
 * en ingresos-gastos pero balance bajo porque ese dinero se transfiere fuera).
 */
export function balanceByAccount(profile: FinancialProfile, masterAccounts: string[] = []): AccountBalance[] {
  const accounts: string[] = [...masterAccounts];
  const add = (a: string) => {
    if (!accounts.includes(a)) accounts.push(a);
  };
  for (const a of profile.accountFlows) add(a.account);
  for (const i of profile.incomes) add(i.account);
  for (const e of profile.expenses) add(e.account);
  for (const t of profile.transfers) {
    add(t.fromAccount);
    add(t.toAccount);
  }

  return accounts.map((account) => {
    const income = sum(profile.incomes.filter((i) => i.account === account).map((i) => i.monthlyAmount));
    const expenses = sum(profile.expenses.filter((e) => e.account === account).map((e) => e.monthlyAmount));
    const transfersOut = sum(
      profile.transfers.filter((t) => t.fromAccount === account).map((t) => t.monthlyAmount),
    );
    const transfersIn = sum(
      profile.transfers.filter((t) => t.toAccount === account).map((t) => t.monthlyAmount),
    );
    return {
      account,
      income,
      expenses,
      transfersIn,
      transfersOut,
      balance: income + transfersIn - expenses - transfersOut,
    };
  });
}

export function netMonthlyCashflow(profile: FinancialProfile): number {
  return totalMonthlyIncome(profile) - totalMonthlyExpenses(profile);
}

function trackedAccountNames(trackers: SavingsTracker[]): Set<string> {
  return new Set(trackers.map((t) => t.account));
}

/**
 * Dinero que va deliberadamente a ahorro o inversión: el balance neto mensual
 * (ingresos + transferencias entrantes − gastos − transferencias salientes)
 * de cada cuenta que tiene un seguimiento real (fondo de emergencia o alguna
 * inversión) vinculado. Si dos seguimientos comparten cuenta, esa cuenta solo
 * cuenta una vez.
 */
export function deliberateSavingsAndInvestment(
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
): number {
  const tracked = trackedAccountNames(trackers);
  return sum(accountBalances.filter((a) => tracked.has(a.account)).map((a) => a.balance));
}

/** Dinero que se acumula en cuentas sin un seguimiento de ahorro/inversión vinculado (ni gasto asignado). */
export function idleSurplus(accountBalances: AccountBalance[], trackers: SavingsTracker[]): number {
  const tracked = trackedAccountNames(trackers);
  return sum(
    accountBalances.filter((a) => !tracked.has(a.account)).map((a) => Math.max(0, a.balance)),
  );
}

export function savingsRate(
  profile: FinancialProfile,
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
): number {
  const income = totalMonthlyIncome(profile);
  if (income === 0) return 0;
  return deliberateSavingsAndInvestment(accountBalances, trackers) / income;
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
  const monthsElapsed = monthsElapsedSince(debt.balanceAsOf, today);
  return Math.max(0, debt.remainingBalance - monthsElapsed * debt.monthlyPayment);
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

export function emergencyFundProgress(profile: FinancialProfile, currentBalance: number): number {
  const target = emergencyFundTarget(profile);
  if (target === 0) return 1;
  return Math.min(1, currentBalance / target);
}

/**
 * Meses transcurridos entre un mes "YYYY-MM" y hoy, nunca negativo.
 */
export function monthsElapsedSince(yyyyMM: string, today: Date = new Date()): number {
  const [year, month] = yyyyMM.split("-").map(Number);
  return Math.max(0, (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month));
}

export function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/**
 * Saldo estimado de un seguimiento de ahorro/inversión: parte del saldo
 * inicial conocido y suma, por cada mes transcurrido desde entonces, el
 * balance neto mensual actual de la cuenta a la que está vinculado
 * (ingresos + transferencias entrantes − gastos − transferencias salientes).
 * Es una aproximación: asume que ese balance mensual se ha mantenido
 * constante desde `initialBalanceAsOf`.
 */
export function estimatedTrackerBalance(
  tracker: SavingsTracker,
  accountBalances: AccountBalance[],
  today: Date = new Date(),
): number {
  const monthlyRate = accountBalances.find((a) => a.account === tracker.account)?.balance ?? 0;
  const monthsElapsed = monthsElapsedSince(tracker.initialBalanceAsOf, today);
  return Math.max(0, tracker.initialBalance + monthlyRate * monthsElapsed);
}

export function emergencyFundTracker(trackers: SavingsTracker[]): SavingsTracker | undefined {
  return trackers.find((t) => t.kind === "emergency_fund");
}

export function investmentTrackers(trackers: SavingsTracker[]): SavingsTracker[] {
  return trackers.filter((t) => t.kind === "investment");
}

/** Saldo actual del fondo de emergencia, o 0 si todavía no se ha configurado. */
export function currentEmergencyFundBalance(
  trackers: SavingsTracker[],
  accountBalances: AccountBalance[],
  today: Date = new Date(),
): number {
  const tracker = emergencyFundTracker(trackers);
  if (!tracker) return 0;
  return estimatedTrackerBalance(tracker, accountBalances, today);
}

export interface Recommendation {
  severity: "alta" | "media" | "baja";
  title: string;
  detail: string;
}

export function buildRecommendations(
  profile: FinancialProfile,
  emergencyFundBalance: number,
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const idle = idleSurplus(accountBalances, trackers);
  const income = totalMonthlyIncome(profile);
  const rate = savingsRate(profile, accountBalances, trackers);
  const efProgress = emergencyFundProgress(profile, emergencyFundBalance);

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
