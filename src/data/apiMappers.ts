import type { Debt, ExpenseItem, IncomeSource, NewDebt, NewExpenseItem, NewIncomeSource, NewTransfer, Transfer } from "../domain/types";

export interface ApiIncome {
  id: string;
  account: string;
  label: string;
  monthlyAmount: number;
  property: string | null;
  propertyId: string | null;
}

export type NewApiIncome = Omit<ApiIncome, "id">;

// El backend usa "category" (no "group", palabra reservada en SQL) y null en vez de undefined.

export interface ApiExpense {
  id: string;
  category: ExpenseItem["group"];
  account: string;
  property: string | null;
  propertyId: string | null;
  label: string;
  monthlyAmount: number;
}

export type NewApiExpense = Omit<ApiExpense, "id">;

export interface ApiDebt {
  id: string;
  name: string;
  monthlyPayment: number;
  dueDate: string;
  remainingBalance: number | null;
  balanceAsOf: string | null;
}

export type NewApiDebt = Omit<ApiDebt, "id">;

export function toExpenseItem(e: ApiExpense): ExpenseItem {
  return {
    id: e.id,
    group: e.category,
    account: e.account,
    property: e.property ?? undefined,
    propertyId: e.propertyId ?? undefined,
    label: e.label,
    monthlyAmount: e.monthlyAmount,
  };
}

export function toApiExpense(e: NewExpenseItem): NewApiExpense {
  return {
    category: e.group,
    account: e.account,
    property: e.property ?? null,
    propertyId: e.propertyId ?? null,
    label: e.label,
    monthlyAmount: e.monthlyAmount,
  };
}

export function toDebt(d: ApiDebt): Debt {
  return {
    id: d.id,
    name: d.name,
    monthlyPayment: d.monthlyPayment,
    dueDate: d.dueDate,
    remainingBalance: d.remainingBalance ?? undefined,
    balanceAsOf: d.balanceAsOf ?? undefined,
  };
}

export function toApiDebt(d: NewDebt): NewApiDebt {
  return {
    name: d.name,
    monthlyPayment: d.monthlyPayment,
    dueDate: d.dueDate,
    remainingBalance: d.remainingBalance ?? null,
    balanceAsOf: d.balanceAsOf ?? null,
  };
}

export function toIncomeSource(i: ApiIncome): IncomeSource {
  return {
    id: i.id,
    account: i.account,
    label: i.label,
    monthlyAmount: i.monthlyAmount,
    property: i.property ?? undefined,
    propertyId: i.propertyId ?? undefined,
  };
}

export function toApiIncome(i: NewIncomeSource): NewApiIncome {
  return {
    account: i.account,
    label: i.label,
    monthlyAmount: i.monthlyAmount,
    property: i.property ?? null,
    propertyId: i.propertyId ?? null,
  };
}

// Transfer tiene exactamente la misma forma en API y dominio.
export type ApiTransfer = Transfer;
export type NewApiTransfer = NewTransfer;
