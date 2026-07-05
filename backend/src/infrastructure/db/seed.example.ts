import "dotenv/config";
import { pool } from "./pool.js";
import type {
  NewAccount,
  NewDebt,
  NewExpense,
  NewIncome,
  NewProperty,
  NewSavingsTracker,
  NewTransfer,
} from "../../domain/types.js";

/**
 * Plantilla de ejemplo. Copia este archivo a `seed.ts` (ignorado por git)
 * y sustituye los valores por tus datos reales.
 */
const accounts: NewAccount[] = [{ name: "Cuenta Nómina" }, { name: "Cuenta Ahorro" }];

const incomes: NewIncome[] = [
  { account: "Cuenta Nómina", label: "Sueldo Neto mensual", monthlyAmount: 2000, property: null },
];

const properties: NewProperty[] = [{ name: "Piso alquilado", estimatedValue: 120000 }];

const expenses: NewExpense[] = [
  { category: "Fijos", account: "Cuenta Nómina", property: null, label: "Alquiler", monthlyAmount: 700 },
  { category: "Variables", account: "Cuenta Nómina", property: null, label: "Ocio", monthlyAmount: 150 },
];

const debts: NewDebt[] = [
  { name: "Préstamo coche", monthlyPayment: 150, dueDate: "01/2028", remainingBalance: 3000, balanceAsOf: null },
];

const transfers: NewTransfer[] = [
  { fromAccount: "Cuenta Nómina", toAccount: "Cuenta Ahorro", monthlyAmount: 200 },
];

const savingsTrackers: NewSavingsTracker[] = [
  {
    kind: "emergency_fund",
    name: "Fondo de emergencia",
    account: "Cuenta Ahorro",
    initialBalance: 500,
    initialBalanceAsOf: "2026-01",
  },
];

async function seed() {
  await pool.query("truncate accounts, incomes, expenses, debts, transfers, savings_trackers, properties");

  for (const a of accounts) {
    await pool.query("insert into accounts (name) values ($1)", [a.name]);
  }

  for (const i of incomes) {
    await pool.query(
      "insert into incomes (account, label, monthly_amount, property) values ($1, $2, $3, $4)",
      [i.account, i.label, i.monthlyAmount, i.property],
    );
  }

  for (const p of properties) {
    await pool.query("insert into properties (name, estimated_value) values ($1, $2)", [p.name, p.estimatedValue]);
  }

  for (const e of expenses) {
    await pool.query(
      "insert into expenses (category, account, property, label, monthly_amount) values ($1, $2, $3, $4, $5)",
      [e.category, e.account, e.property, e.label, e.monthlyAmount],
    );
  }

  for (const d of debts) {
    await pool.query(
      "insert into debts (name, monthly_payment, due_date, remaining_balance, balance_as_of) values ($1, $2, $3, $4, $5)",
      [d.name, d.monthlyPayment, d.dueDate, d.remainingBalance, d.balanceAsOf],
    );
  }

  for (const t of transfers) {
    await pool.query(
      "insert into transfers (from_account, to_account, monthly_amount) values ($1, $2, $3)",
      [t.fromAccount, t.toAccount, t.monthlyAmount],
    );
  }

  for (const s of savingsTrackers) {
    await pool.query(
      "insert into savings_trackers (kind, name, account, initial_balance, initial_balance_as_of) values ($1, $2, $3, $4, $5)",
      [s.kind, s.name, s.account, s.initialBalance, s.initialBalanceAsOf],
    );
  }

  console.log("Seed de ejemplo completo.");
  await pool.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
