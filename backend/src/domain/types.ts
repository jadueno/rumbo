export interface Account {
  id: string;
  name: string;
}

export type NewAccount = Omit<Account, "id">;

/** Singleton: siempre hay exactamente una fila (sin id expuesto a la API). */
export interface Profile {
  name: string;
  /** Formato "YYYY-MM-DD". */
  birthDate: string;
  emergencyFundTargetMonths: number;
}

export interface Income {
  id: string;
  account: string;
  label: string;
  monthlyAmount: number;
  /** Nota libre, sin relación con `properties` (a diferencia de `propertyId`). */
  property: string | null;
  /** FK real a `properties.id` (ON DELETE SET NULL) — a diferencia de `property`, no se
   * queda huérfana si se borra la propiedad. */
  propertyId: string | null;
}

export type NewIncome = Omit<Income, "id">;

export interface Property {
  id: string;
  name: string;
  estimatedValue: number;
}

export type NewProperty = Omit<Property, "id">;

export type ExpenseCategory = "Fijos" | "Variables" | "Autónomo";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  account: string;
  /** Nota libre, sin relación con `properties` (a diferencia de `propertyId`). */
  property: string | null;
  /** FK real a `properties.id` (ON DELETE SET NULL) — a diferencia de `property`, no se
   * queda huérfana si se borra la propiedad. */
  propertyId: string | null;
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

/** Singleton: posiciones que el usuario ha arrastrado en el diagrama de "Flujo de
 * cuentas", indexadas por id de nodo (p. ej. "account-BBVA", "income-<uuid>"). */
export type FlujoPositions = Record<string, { x: number; y: number }>;
