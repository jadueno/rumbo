import type { Account, Debt, Expense, Income, SavingsTracker, Transfer } from "../domain/types.js";

export interface DataExport {
  exportedAt: string;
  accounts: Account[];
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  transfers: Transfer[];
  savingsTrackers: SavingsTracker[];
}

interface Listable<T> {
  list(): Promise<T[]>;
}

export function createExportUseCases(repos: {
  accounts: Listable<Account>;
  incomes: Listable<Income>;
  expenses: Listable<Expense>;
  debts: Listable<Debt>;
  transfers: Listable<Transfer>;
  savingsTrackers: Listable<SavingsTracker>;
}) {
  return {
    exportAll: async (): Promise<DataExport> => {
      const [accounts, incomes, expenses, debts, transfers, savingsTrackers] = await Promise.all([
        repos.accounts.list(),
        repos.incomes.list(),
        repos.expenses.list(),
        repos.debts.list(),
        repos.transfers.list(),
        repos.savingsTrackers.list(),
      ]);
      return { exportedAt: new Date().toISOString(), accounts, incomes, expenses, debts, transfers, savingsTrackers };
    },
  };
}
