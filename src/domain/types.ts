export interface Account {
  id: string;
  name: string;
}

export type NewAccount = Omit<Account, "id">;

export interface IncomeSource {
  id: string;
  account: string;
  label: string;
  monthlyAmount: number;
}

export type NewIncomeSource = Omit<IncomeSource, "id">;

export type ExpenseGroup = "Fijos" | "Variables" | "Autónomo";

export interface ExpenseItem {
  id: string;
  group: ExpenseGroup;
  account: string;
  property?: string;
  label: string;
  monthlyAmount: number;
}

export type NewExpenseItem = Omit<ExpenseItem, "id">;

export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  monthlyAmount: number;
  /** true si el destino es ahorro o inversión real, no solo mover dinero para gastar */
  isSavingsOrInvestment: boolean;
}

export type NewTransfer = Omit<Transfer, "id">;

export interface AccountFlow {
  account: string;
  entra: number;
  sale: number;
}

export interface Debt {
  id: string;
  name: string;
  monthlyPayment: number;
  dueDate: string;
  /** Saldo pendiente conocido en el mes `balanceAsOf` (no se actualiza solo). */
  remainingBalance?: number;
  /** Mes al que corresponde `remainingBalance`, formato "YYYY-MM". */
  balanceAsOf?: string;
}

export type NewDebt = Omit<Debt, "id">;

export interface EmergencyFund {
  targetMonths: number;
  currentBalance: number;
}

export interface FinancialProfile {
  age: number;
  incomes: IncomeSource[];
  expenses: ExpenseItem[];
  transfers: Transfer[];
  accountFlows: AccountFlow[];
  debts: Debt[];
  emergencyFund: EmergencyFund;
}
