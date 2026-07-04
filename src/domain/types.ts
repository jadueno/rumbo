export interface IncomeSource {
  account: string;
  label: string;
  monthlyAmount: number;
}

export type ExpenseGroup = "Fijos" | "Variables" | "Autónomo";

export interface ExpenseItem {
  group: ExpenseGroup;
  account: string;
  property?: string;
  label: string;
  monthlyAmount: number;
}

export interface Transfer {
  fromAccount: string;
  toAccount: string;
  monthlyAmount: number;
  /** true si el destino es ahorro o inversión real, no solo mover dinero para gastar */
  isSavingsOrInvestment: boolean;
}

export interface AccountFlow {
  account: string;
  entra: number;
  sale: number;
}

export interface Debt {
  name: string;
  monthlyPayment: number;
  dueDate: string;
  remainingBalance?: number;
}

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
