import { describe, expect, it } from "vitest";
import {
  balanceByAccount,
  buildRecommendations,
  currentEmergencyFundBalance,
  deliberateSavingsAndInvestment,
  emergencyFundProgress,
  emergencyFundTarget,
  emergencyFundTracker,
  estimatedRemainingBalance,
  estimatedTrackerBalance,
  formatEUR,
  formatMonth,
  idleSurplus,
  investmentTrackers,
  monthsElapsedSince,
  netMonthlyCashflow,
  recommendedNetWorth,
  savingsRate,
  totalEstimatedRemainingDebt,
  totalMonthlyDebtPayments,
  totalMonthlyExpenses,
  totalMonthlyIncome,
} from "./calculations";
import type { Debt, FinancialProfile, SavingsTracker } from "./types";

function makeProfile(overrides: Partial<FinancialProfile> = {}): FinancialProfile {
  return {
    age: 30,
    incomes: [],
    expenses: [],
    transfers: [],
    accountFlows: [],
    debts: [],
    emergencyFund: { targetMonths: 3 },
    ...overrides,
  };
}

describe("totalMonthlyIncome / totalMonthlyExpenses", () => {
  it("suma los importes mensuales de todas las fuentes", () => {
    const profile = makeProfile({
      incomes: [
        { id: "1", account: "Nomina", label: "Salario", monthlyAmount: 2000 },
        { id: "2", account: "Nomina", label: "Freelance", monthlyAmount: 500 },
      ],
      expenses: [{ id: "1", group: "Fijos", account: "Nomina", label: "Alquiler", monthlyAmount: 800 }],
    });

    expect(totalMonthlyIncome(profile)).toBe(2500);
    expect(totalMonthlyExpenses(profile)).toBe(800);
  });

  it("devuelve 0 cuando no hay entradas", () => {
    expect(totalMonthlyIncome(makeProfile())).toBe(0);
    expect(totalMonthlyExpenses(makeProfile())).toBe(0);
  });
});

describe("netMonthlyCashflow", () => {
  it("resta gastos a ingresos", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "A", label: "Salario", monthlyAmount: 3000 }],
      expenses: [{ id: "1", group: "Fijos", account: "A", label: "Alquiler", monthlyAmount: 1200 }],
    });
    expect(netMonthlyCashflow(profile)).toBe(1800);
  });

  it("puede ser negativo si se gasta más de lo que se ingresa", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "A", label: "Salario", monthlyAmount: 1000 }],
      expenses: [{ id: "1", group: "Fijos", account: "A", label: "Alquiler", monthlyAmount: 1500 }],
    });
    expect(netMonthlyCashflow(profile)).toBe(-500);
  });
});

describe("balanceByAccount", () => {
  it("agrupa ingresos, gastos y transferencias por cuenta y calcula el balance neto", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "Nomina", label: "Salario", monthlyAmount: 3000 }],
      expenses: [{ id: "1", group: "Fijos", account: "Nomina", label: "Alquiler", monthlyAmount: 1000 }],
      transfers: [{ id: "1", fromAccount: "Nomina", toAccount: "Ahorro", monthlyAmount: 500 }],
    });

    const balances = balanceByAccount(profile);
    const nomina = balances.find((b) => b.account === "Nomina");
    const ahorro = balances.find((b) => b.account === "Ahorro");

    expect(nomina).toEqual({
      account: "Nomina",
      income: 3000,
      expenses: 1000,
      transfersIn: 0,
      transfersOut: 500,
      balance: 1500,
    });
    expect(ahorro).toEqual({
      account: "Ahorro",
      income: 0,
      expenses: 0,
      transfersIn: 500,
      transfersOut: 0,
      balance: 500,
    });
  });

  it("respeta el orden de masterAccounts y añade cuentas nuevas al final", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "Extra", label: "Bono", monthlyAmount: 100 }],
    });

    const balances = balanceByAccount(profile, ["Nomina", "Ahorro"]);
    expect(balances.map((b) => b.account)).toEqual(["Nomina", "Ahorro", "Extra"]);
  });

  it("no duplica una cuenta que aparece en varias fuentes", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "Nomina", label: "Salario", monthlyAmount: 100 }],
      expenses: [{ id: "1", group: "Fijos", account: "Nomina", label: "Gasto", monthlyAmount: 50 }],
    });
    const balances = balanceByAccount(profile);
    expect(balances.filter((b) => b.account === "Nomina")).toHaveLength(1);
  });
});

describe("deliberateSavingsAndInvestment / idleSurplus", () => {
  const trackers: SavingsTracker[] = [
    {
      id: "1",
      kind: "emergency_fund",
      name: "Fondo",
      account: "Ahorro",
      initialBalance: 0,
      initialBalanceAsOf: "2026-01",
    },
  ];
  const accountBalances = [
    { account: "Ahorro", income: 0, expenses: 0, transfersIn: 500, transfersOut: 0, balance: 500 },
    { account: "Nomina", income: 3000, expenses: 1000, transfersIn: 0, transfersOut: 500, balance: 1500 },
  ];

  it("solo cuenta el balance de cuentas con seguimiento vinculado", () => {
    expect(deliberateSavingsAndInvestment(accountBalances, trackers)).toBe(500);
  });

  it("idleSurplus solo cuenta cuentas sin seguimiento y nunca resta (clamp a 0)", () => {
    expect(idleSurplus(accountBalances, trackers)).toBe(1500);
  });

  it("idleSurplus ignora balances negativos en vez de restarlos", () => {
    const negativeBalances = [
      { account: "Nomina", income: 1000, expenses: 1500, transfersIn: 0, transfersOut: 0, balance: -500 },
    ];
    expect(idleSurplus(negativeBalances, [])).toBe(0);
  });

  it("una cuenta compartida por dos seguimientos solo cuenta una vez", () => {
    const twoTrackers: SavingsTracker[] = [
      ...trackers,
      {
        id: "2",
        kind: "investment",
        name: "Inversión",
        account: "Ahorro",
        initialBalance: 0,
        initialBalanceAsOf: "2026-01",
      },
    ];
    expect(deliberateSavingsAndInvestment(accountBalances, twoTrackers)).toBe(500);
  });
});

describe("savingsRate", () => {
  it("calcula la proporción de ingresos que va a ahorro/inversión deliberado", () => {
    const profile = makeProfile({
      incomes: [{ id: "1", account: "Nomina", label: "Salario", monthlyAmount: 2000 }],
    });
    const trackers: SavingsTracker[] = [
      {
        id: "1",
        kind: "emergency_fund",
        name: "Fondo",
        account: "Ahorro",
        initialBalance: 0,
        initialBalanceAsOf: "2026-01",
      },
    ];
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 400, transfersOut: 0, balance: 400 },
    ];
    expect(savingsRate(profile, accountBalances, trackers)).toBe(0.2);
  });

  it("devuelve 0 si no hay ingresos, para evitar dividir por 0", () => {
    expect(savingsRate(makeProfile(), [], [])).toBe(0);
  });
});

describe("totalMonthlyDebtPayments", () => {
  it("suma las cuotas mensuales de todas las deudas", () => {
    const profile = makeProfile({
      debts: [
        { id: "1", name: "Coche", monthlyPayment: 200, dueDate: "2028-01" },
        { id: "2", name: "Hipoteca", monthlyPayment: 800, dueDate: "2050-01" },
      ],
    });
    expect(totalMonthlyDebtPayments(profile)).toBe(1000);
  });
});

describe("estimatedRemainingBalance", () => {
  const baseDebt: Debt = {
    id: "1",
    name: "Coche",
    monthlyPayment: 200,
    dueDate: "2028-01",
    remainingBalance: 5000,
    balanceAsOf: "2026-01",
  };

  it("descuenta una cuota por cada mes completo transcurrido", () => {
    const today = new Date(2026, 3, 15); // 2026-04-15 → 3 meses desde 2026-01
    expect(estimatedRemainingBalance(baseDebt, today)).toBe(5000 - 3 * 200);
  });

  it("nunca baja de 0 aunque hayan pasado más meses de los necesarios", () => {
    const today = new Date(2030, 0, 1);
    expect(estimatedRemainingBalance(baseDebt, today)).toBe(0);
  });

  it("devuelve remainingBalance tal cual si falta balanceAsOf", () => {
    const debt: Debt = { ...baseDebt, balanceAsOf: undefined };
    expect(estimatedRemainingBalance(debt, new Date(2027, 0, 1))).toBe(5000);
  });

  it("devuelve undefined si no hay remainingBalance registrado", () => {
    const debt: Debt = { id: "1", name: "Coche", monthlyPayment: 200, dueDate: "2028-01" };
    expect(estimatedRemainingBalance(debt, new Date())).toBeUndefined();
  });
});

describe("totalEstimatedRemainingDebt", () => {
  it("suma solo las deudas con saldo estimable y omite las que no lo tienen", () => {
    const profile = makeProfile({
      debts: [
        { id: "1", name: "Coche", monthlyPayment: 200, dueDate: "2028-01", remainingBalance: 1000, balanceAsOf: "2026-01" },
        { id: "2", name: "Préstamo sin saldo", monthlyPayment: 50, dueDate: "2028-01" },
      ],
    });
    const today = new Date(2026, 0, 15); // mismo mes, 0 meses transcurridos
    expect(totalEstimatedRemainingDebt(profile, today)).toBe(1000);
  });
});

describe("recommendedNetWorth", () => {
  it("aplica la fórmula edad × ingreso anual / 10", () => {
    const profile = makeProfile({
      age: 40,
      incomes: [{ id: "1", account: "A", label: "Salario", monthlyAmount: 3000 }],
    });
    expect(recommendedNetWorth(profile)).toBe((40 * 3000 * 12) / 10);
  });
});

describe("emergencyFundTarget / emergencyFundProgress", () => {
  it("calcula el objetivo como meses × gasto mensual total", () => {
    const profile = makeProfile({
      emergencyFund: { targetMonths: 6 },
      expenses: [{ id: "1", group: "Fijos", account: "A", label: "Alquiler", monthlyAmount: 1000 }],
    });
    expect(emergencyFundTarget(profile)).toBe(6000);
  });

  it("progreso se limita a 1 aunque el saldo supere el objetivo", () => {
    const profile = makeProfile({
      emergencyFund: { targetMonths: 3 },
      expenses: [{ id: "1", group: "Fijos", account: "A", label: "Alquiler", monthlyAmount: 1000 }],
    });
    expect(emergencyFundProgress(profile, 10000)).toBe(1);
  });

  it("progreso es 1 cuando el objetivo es 0 (sin gastos registrados)", () => {
    const profile = makeProfile({ emergencyFund: { targetMonths: 3 } });
    expect(emergencyFundProgress(profile, 0)).toBe(1);
  });
});

describe("monthsElapsedSince", () => {
  it("cuenta meses completos entre un mes YYYY-MM y hoy", () => {
    expect(monthsElapsedSince("2026-01", new Date(2026, 3, 1))).toBe(3);
  });

  it("nunca es negativo, aunque el mes sea futuro", () => {
    expect(monthsElapsedSince("2027-01", new Date(2026, 0, 1))).toBe(0);
  });

  it("es 0 dentro del mismo mes", () => {
    expect(monthsElapsedSince("2026-05", new Date(2026, 4, 28))).toBe(0);
  });
});

describe("formatMonth", () => {
  it("formatea YYYY-MM en español (mes y año)", () => {
    expect(formatMonth("2026-03")).toBe("marzo de 2026");
  });
});

describe("estimatedTrackerBalance", () => {
  it("suma el balance mensual de la cuenta vinculada por cada mes transcurrido", () => {
    const tracker: SavingsTracker = {
      id: "1",
      kind: "emergency_fund",
      name: "Fondo",
      account: "Ahorro",
      initialBalance: 1000,
      initialBalanceAsOf: "2026-01",
    };
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 300, transfersOut: 0, balance: 300 },
    ];
    const today = new Date(2026, 3, 1); // 3 meses desde 2026-01
    expect(estimatedTrackerBalance(tracker, accountBalances, today)).toBe(1000 + 3 * 300);
  });

  it("nunca baja de 0 aunque el balance mensual sea negativo", () => {
    const tracker: SavingsTracker = {
      id: "1",
      kind: "emergency_fund",
      name: "Fondo",
      account: "Ahorro",
      initialBalance: 100,
      initialBalanceAsOf: "2026-01",
    };
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 500, transfersIn: 0, transfersOut: 0, balance: -500 },
    ];
    const today = new Date(2026, 5, 1);
    expect(estimatedTrackerBalance(tracker, accountBalances, today)).toBe(0);
  });

  it("trata la cuenta como balance 0 si no aparece en accountBalances", () => {
    const tracker: SavingsTracker = {
      id: "1",
      kind: "investment",
      name: "Inversión",
      account: "Desconocida",
      initialBalance: 200,
      initialBalanceAsOf: "2026-01",
    };
    expect(estimatedTrackerBalance(tracker, [], new Date(2026, 6, 1))).toBe(200);
  });
});

describe("emergencyFundTracker / investmentTrackers", () => {
  const trackers: SavingsTracker[] = [
    { id: "1", kind: "emergency_fund", name: "Fondo", account: "A", initialBalance: 0, initialBalanceAsOf: "2026-01" },
    { id: "2", kind: "investment", name: "Indexado", account: "B", initialBalance: 0, initialBalanceAsOf: "2026-01" },
    { id: "3", kind: "investment", name: "Cripto", account: "C", initialBalance: 0, initialBalanceAsOf: "2026-01" },
  ];

  it("encuentra el único tracker de tipo emergency_fund", () => {
    expect(emergencyFundTracker(trackers)?.id).toBe("1");
  });

  it("devuelve undefined si no hay fondo de emergencia configurado", () => {
    expect(emergencyFundTracker([])).toBeUndefined();
  });

  it("filtra solo los trackers de inversión", () => {
    expect(investmentTrackers(trackers).map((t) => t.id)).toEqual(["2", "3"]);
  });
});

describe("currentEmergencyFundBalance", () => {
  it("devuelve 0 si no hay fondo de emergencia configurado", () => {
    expect(currentEmergencyFundBalance([], [], new Date())).toBe(0);
  });

  it("delega en estimatedTrackerBalance cuando sí existe", () => {
    const trackers: SavingsTracker[] = [
      { id: "1", kind: "emergency_fund", name: "Fondo", account: "Ahorro", initialBalance: 1000, initialBalanceAsOf: "2026-01" },
    ];
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 100, transfersOut: 0, balance: 100 },
    ];
    const today = new Date(2026, 1, 1); // 1 mes transcurrido
    expect(currentEmergencyFundBalance(trackers, accountBalances, today)).toBe(1100);
  });
});

describe("buildRecommendations", () => {
  function fullyHealthyProfile(): { profile: FinancialProfile; trackers: SavingsTracker[] } {
    const profile = makeProfile({
      age: 30,
      incomes: [{ id: "1", account: "Nomina", label: "Salario", monthlyAmount: 3000 }],
      expenses: [{ id: "1", group: "Fijos", account: "Nomina", label: "Gastos", monthlyAmount: 1500 }],
      debts: [{ id: "1", name: "Coche", monthlyPayment: 100, dueDate: "2028-01" }],
      emergencyFund: { targetMonths: 3 },
    });
    const trackers: SavingsTracker[] = [
      { id: "1", kind: "emergency_fund", name: "Fondo", account: "Ahorro", initialBalance: 0, initialBalanceAsOf: "2026-01" },
    ];
    return { profile, trackers };
  }

  it("devuelve una recomendación de severidad baja cuando no hay señales de alerta", () => {
    const { profile, trackers } = fullyHealthyProfile();
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 950, transfersOut: 0, balance: 950 },
      { account: "Nomina", income: 3000, expenses: 1500, transfersIn: 0, transfersOut: 950, balance: 550 },
    ];
    const efTarget = 3 * 1500; // 4500
    const recs = buildRecommendations(profile, efTarget, accountBalances, trackers);
    expect(recs).toEqual([
      { severity: "baja", title: "Salud financiera saludable", detail: expect.any(String) },
    ]);
  });

  it("avisa de dinero ocioso cuando el idle supera el 20% de los ingresos", () => {
    const { profile, trackers } = fullyHealthyProfile();
    const accountBalances = [
      { account: "Nomina", income: 3000, expenses: 1500, transfersIn: 0, transfersOut: 0, balance: 1500 },
    ];
    const recs = buildRecommendations(profile, 4500, accountBalances, trackers);
    expect(recs.some((r) => r.title === "Dinero acumulándose sin destino")).toBe(true);
  });

  it("marca severidad alta de tasa de ahorro por debajo del 10% y media entre 10-20%", () => {
    const { profile, trackers } = fullyHealthyProfile();

    const lowRateBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 100, transfersOut: 0, balance: 100 },
      { account: "Nomina", income: 3000, expenses: 1500, transfersIn: 0, transfersOut: 100, balance: 1400 },
    ];
    const lowRateRecs = buildRecommendations(profile, 4500, lowRateBalances, trackers);
    expect(lowRateRecs.find((r) => r.title.includes("ahorro/inversión"))?.severity).toBe("alta");

    const mediumRateBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 450, transfersOut: 0, balance: 450 },
      { account: "Nomina", income: 3000, expenses: 1500, transfersIn: 0, transfersOut: 450, balance: 1050 },
    ];
    const mediumRateRecs = buildRecommendations(profile, 4500, mediumRateBalances, trackers);
    expect(mediumRateRecs.find((r) => r.title.includes("ahorro/inversión"))?.severity).toBe("media");
  });

  it("marca carga de deuda alta cuando las cuotas superan el 35% de los ingresos", () => {
    const profile = makeProfile({
      age: 30,
      incomes: [{ id: "1", account: "Nomina", label: "Salario", monthlyAmount: 1000 }],
      expenses: [{ id: "1", group: "Fijos", account: "Nomina", label: "Gastos", monthlyAmount: 200 }],
      debts: [{ id: "1", name: "Préstamo", monthlyPayment: 400, dueDate: "2028-01" }],
      emergencyFund: { targetMonths: 3 },
    });
    const accountBalances = [
      { account: "Nomina", income: 1000, expenses: 200, transfersIn: 0, transfersOut: 0, balance: 800 },
    ];
    const recs = buildRecommendations(profile, 600, accountBalances, []);
    expect(recs.some((r) => r.title === "Carga de deuda elevada")).toBe(true);
  });

  it("marca el fondo de emergencia incompleto con severidad según lo lejos que esté del objetivo", () => {
    const { profile, trackers } = fullyHealthyProfile();
    const accountBalances = [
      { account: "Ahorro", income: 0, expenses: 0, transfersIn: 700, transfersOut: 0, balance: 700 },
      { account: "Nomina", income: 3000, expenses: 1600, transfersIn: 0, transfersOut: 700, balance: 700 },
    ];
    const target = emergencyFundTarget(profile); // 4500

    const almostEmpty = buildRecommendations(profile, target * 0.2, accountBalances, trackers);
    expect(almostEmpty.find((r) => r.title === "Fondo de emergencia incompleto")?.severity).toBe("alta");

    const halfFull = buildRecommendations(profile, target * 0.6, accountBalances, trackers);
    expect(halfFull.find((r) => r.title === "Fondo de emergencia incompleto")?.severity).toBe("media");
  });
});

describe("formatEUR", () => {
  // Intl usa U+00A0 (espacio de no separación) antes de "€"; se normaliza a
  // un espacio normal para no acoplar el test a ese detalle de la ICU.
  const normalize = (s: string) => s.replace(/ /g, " ");

  it("formatea como moneda EUR sin decimales", () => {
    expect(normalize(formatEUR(12345))).toBe("12.345 €");
  });

  it("redondea en vez de truncar decimales", () => {
    expect(normalize(formatEUR(12345.6))).toBe("12.346 €");
  });
});
