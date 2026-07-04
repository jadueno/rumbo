export interface Account {
  id: string;
  name: string;
}

export type NewAccount = Omit<Account, "id">;

export interface Income {
  id: string;
  account: string;
  label: string;
  monthlyAmount: number;
}

export type NewIncome = Omit<Income, "id">;

export type ExpenseCategory = "Fijos" | "Variables" | "Autónomo";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  account: string;
  property: string | null;
  label: string;
  monthlyAmount: number;
}

export type NewExpense = Omit<Expense, "id">;

export interface Debt {
  id: string;
  name: string;
  monthlyPayment: number;
  dueDate: string;
  remainingBalance: number | null;
  balanceAsOf: string | null;
}

export type NewDebt = Omit<Debt, "id">;

export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  monthlyAmount: number;
  isSavingsOrInvestment: boolean;
}

export type NewTransfer = Omit<Transfer, "id">;

export type TrackerKind = "emergency_fund" | "investment";

export interface SavingsTracker {
  id: string;
  kind: TrackerKind;
  name: string;
  account: string;
  initialBalance: number;
  /** Mes al que corresponde initialBalance, formato "YYYY-MM". */
  initialBalanceAsOf: string;
}

export type NewSavingsTracker = Omit<SavingsTracker, "id">;
