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

/**
 * Patrimonio neto actual estimado: suma de todos los seguimientos de ahorro
 * e inversión (fondo de emergencia + inversiones) menos la deuda pendiente
 * estimada. Aproximado, igual que estimatedTrackerBalance y
 * totalEstimatedRemainingDebt: no incluye dinero en cuentas sin seguimiento.
 */
export function currentNetWorth(
  profile: FinancialProfile,
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
  today: Date = new Date(),
): number {
  const trackedAssets = sum(trackers.map((t) => estimatedTrackerBalance(t, accountBalances, today)));
  return trackedAssets - totalEstimatedRemainingDebt(profile, today);
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

  const net = netMonthlyCashflow(profile);
  if (net < 0) {
    recs.push({
      severity: "alta",
      title: "Gastas más de lo que ingresas",
      detail: `Cada mes se van ${formatEUR(Math.abs(net))} más de lo que entra. Antes de pensar en ahorro o inversión, hay que cerrar ese agujero: revisa gastos variables o busca ingresos adicionales.`,
    });
  }

  const netWorthTarget = recommendedNetWorth(profile);
  if (netWorthTarget > 0) {
    const netWorth = currentNetWorth(profile, accountBalances, trackers);
    const netWorthProgress = netWorth / netWorthTarget;
    if (netWorthProgress < 0.8) {
      recs.push({
        severity: netWorthProgress < 0.5 ? "alta" : "media",
        title: "Patrimonio por debajo de lo recomendado para tu edad",
        detail: `Tu patrimonio estimado (${formatEUR(netWorth)}, solo cuentas con seguimiento) está por debajo del recomendado para tu edad e ingresos (${formatEUR(netWorthTarget)}, edad × ingreso anual / 10). No es una carrera, pero conviene vigilar la tendencia.`,
      });
    }
  }

  if (profile.debts.length > 1) {
    recs.push({
      severity: "media",
      title: "Varias deudas activas a la vez",
      detail: `Tienes ${profile.debts.length} deudas abiertas. Para pagarlas antes, prioriza: la de mayor interés primero (estrategia avalancha, ahorra más dinero) o la de menor saldo primero (estrategia snowball, motiva más rápido). Mantener el pago mínimo en el resto mientras concentras el extra en una sola acelera el fin de todas.`,
    });
  }

  if (profile.incomes.length === 1) {
    recs.push({
      severity: "media",
      title: "Ingresos dependientes de una única fuente",
      detail: "Todo el dinero que entra depende de un solo origen. Si se interrumpiera, no habría red de respaldo inmediata. Plantéate una segunda fuente (freelance, alquiler, dividendos, renta pasiva) aunque sea pequeña al principio.",
    });
  }

  if (accountBalances.length <= 1) {
    recs.push({
      severity: "media",
      title: "Todo el dinero en una sola cuenta",
      detail: "Separar el dinero en cuentas con un propósito claro (gastos del día a día, ahorro, inversión) ayuda a no gastarse por error lo que ya tenía un destino, aunque el banco sea el mismo.",
    });
  }

  if (efProgress >= 1 && investmentTrackers(trackers).length === 0) {
    recs.push({
      severity: "media",
      title: "Fondo de emergencia listo: toca invertir",
      detail: "El fondo de emergencia ya cubre el objetivo. Dejar más dinero acumulado ahí de lo necesario pierde poder adquisitivo frente a la inflación. Es buen momento para dirigir el excedente a una inversión con un seguimiento propio.",
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

export interface FinancialHealthMetrics {
  savingsRate: number;
  debtLoad: number;
  emergencyFundProgress: number;
  idleRatio: number;
}

export type FinancialHealthFactorKey = "savingsRate" | "emergencyFund" | "debtLoad" | "idleSurplus";

export interface FinancialHealthFactor {
  key: FinancialHealthFactorKey;
  label: string;
  /** 0-100: cómo de bien está este factor por sí solo. */
  score: number;
  /** Peso de este factor en el score final (todos los pesos suman 1). */
  weight: number;
}

export interface FinancialHealthScore {
  /** 0-100: media ponderada de los factores. */
  score: number;
  factors: FinancialHealthFactor[];
}

/**
 * Umbrales de referencia: los mismos que ya usa buildRecommendations para
 * decidir cuándo avisar de cada cosa, reutilizados aquí para que el score y
 * las recomendaciones cuenten siempre la misma historia.
 */
const SAVINGS_RATE_TARGET = 0.2;
const DEBT_LOAD_LIMIT = 0.35;
const IDLE_RATIO_LIMIT = 0.2;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Combina métricas ya calculadas (tasa de ahorro, carga de deuda, progreso
 * del fondo de emergencia, ratio de dinero ocioso) en un único score 0-100
 * con desglose explicable por factor, en vez de una caja negra. Separado de
 * financialHealthScore para poder recalcularlo también sobre métricas
 * hipotéticas (el simulador "qué pasaría si").
 */
export function scoreFromMetrics(metrics: FinancialHealthMetrics): FinancialHealthScore {
  const factors: FinancialHealthFactor[] = [
    {
      key: "savingsRate",
      label: "Tasa de ahorro/inversión",
      score: clampScore((metrics.savingsRate / SAVINGS_RATE_TARGET) * 100),
      weight: 0.3,
    },
    {
      key: "emergencyFund",
      label: "Fondo de emergencia",
      score: clampScore(metrics.emergencyFundProgress * 100),
      weight: 0.3,
    },
    {
      key: "debtLoad",
      label: "Carga de deuda",
      score: clampScore(100 - (metrics.debtLoad / DEBT_LOAD_LIMIT) * 100),
      weight: 0.25,
    },
    {
      key: "idleSurplus",
      label: "Dinero con destino (no ocioso)",
      score: clampScore(100 - (metrics.idleRatio / IDLE_RATIO_LIMIT) * 100),
      weight: 0.15,
    },
  ];

  const score = clampScore(sum(factors.map((f) => f.score * f.weight)));
  return { score, factors };
}

/** Ratio de dinero ocioso (sin destino de ahorro/inversión) sobre el ingreso mensual. */
export function idleRatio(profile: FinancialProfile, accountBalances: AccountBalance[], trackers: SavingsTracker[]): number {
  const income = totalMonthlyIncome(profile);
  if (income === 0) return 0;
  return idleSurplus(accountBalances, trackers) / income;
}

/** Score de salud financiera 0-100 a partir de los datos reales actuales. */
export function financialHealthScore(
  profile: FinancialProfile,
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
  emergencyFundBalance: number,
): FinancialHealthScore {
  const income = totalMonthlyIncome(profile);
  const debtLoad = income === 0 ? 0 : totalMonthlyDebtPayments(profile) / income;
  return scoreFromMetrics({
    savingsRate: savingsRate(profile, accountBalances, trackers),
    debtLoad,
    emergencyFundProgress: emergencyFundProgress(profile, emergencyFundBalance),
    idleRatio: idleRatio(profile, accountBalances, trackers),
  });
}

export interface SimulatorAdjustments {
  /** Cambio mensual hipotético de ingresos, en euros (puede ser negativo). */
  incomeDelta: number;
  /** Cambio mensual hipotético de gastos, en euros (puede ser negativo). */
  expensesDelta: number;
  /** Aportación mensual extra hipotética a ahorro/inversión, en euros (puede ser negativa). */
  extraSavingsDelta: number;
}

export interface SimulatorResult {
  income: number;
  expenses: number;
  netCashflow: number;
  deliberateSavings: number;
  savingsRate: number;
  debtLoad: number;
  healthScore: FinancialHealthScore;
}

/**
 * Recalcula cashflow, tasa de ahorro, carga de deuda y score de salud
 * financiera bajo unos ajustes hipotéticos, sin tocar los datos reales. El
 * progreso del fondo de emergencia y el ratio de dinero ocioso son saldos
 * acumulados, no flujos mensuales, así que no cambian con estos ajustes
 * (proyectarlos hacia adelante es un problema distinto, no este simulador).
 */
export function simulateAdjustments(
  profile: FinancialProfile,
  accountBalances: AccountBalance[],
  trackers: SavingsTracker[],
  emergencyFundBalance: number,
  adjustments: SimulatorAdjustments,
): SimulatorResult {
  const baseIncome = totalMonthlyIncome(profile);
  const baseExpenses = totalMonthlyExpenses(profile);
  const baseSavings = deliberateSavingsAndInvestment(accountBalances, trackers);
  const debtPayments = totalMonthlyDebtPayments(profile);

  const income = Math.max(0, baseIncome + adjustments.incomeDelta);
  const expenses = Math.max(0, baseExpenses + adjustments.expensesDelta);
  const savings = Math.max(0, baseSavings + adjustments.extraSavingsDelta);

  const rate = income === 0 ? 0 : savings / income;
  const debtLoad = income === 0 ? 0 : debtPayments / income;
  const healthScore = scoreFromMetrics({
    savingsRate: rate,
    debtLoad,
    emergencyFundProgress: emergencyFundProgress(profile, emergencyFundBalance),
    idleRatio: idleRatio(profile, accountBalances, trackers),
  });

  return {
    income,
    expenses,
    netCashflow: income - expenses,
    deliberateSavings: savings,
    savingsRate: rate,
    debtLoad,
    healthScore,
  };
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
