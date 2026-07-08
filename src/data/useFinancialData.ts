import { useCallback, useEffect, useState } from "react";
import type {
  Account,
  FinancialProfile,
  NewAccount,
  NewDebt,
  NewExpenseItem,
  NewIncomeSource,
  NewProperty,
  NewSavingsTracker,
  NewSnapshot,
  NewTransfer,
  Profile,
  Property,
  SavingsTracker,
  Snapshot,
} from "../domain/types";
import { calculateAge } from "../domain/calculations";
import { createCrudClient, createSingletonClient } from "./api";
import {
  toApiDebt,
  toApiExpense,
  toApiIncome,
  toDebt,
  toExpenseItem,
  toIncomeSource,
  type ApiDebt,
  type ApiExpense,
  type ApiIncome,
  type ApiTransfer,
} from "./apiMappers";

const accountClient = createCrudClient<Account, NewAccount>("/accounts");
const profileClient = createSingletonClient<Profile>("/profile");
const incomeClient = createCrudClient<ApiIncome, ReturnType<typeof toApiIncome>>("/incomes");
const expenseClient = createCrudClient<ApiExpense, ReturnType<typeof toApiExpense>>("/expenses");
const debtClient = createCrudClient<ApiDebt, ReturnType<typeof toApiDebt>>("/debts");
const transferClient = createCrudClient<ApiTransfer, NewTransfer>("/transfers");
const trackerClient = createCrudClient<SavingsTracker, NewSavingsTracker>("/savings-trackers");
const propertyClient = createCrudClient<Property, NewProperty>("/properties");
const snapshotClient = createCrudClient<Snapshot, NewSnapshot>("/snapshots");

export function useFinancialData() {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [rawProfile, setRawProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trackers, setTrackers] = useState<SavingsTracker[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        apiProfile,
        accountList,
        apiIncomes,
        apiExpenses,
        apiDebts,
        transfers,
        trackerList,
        propertyList,
        snapshotList,
      ] = await Promise.all([
        profileClient.get(),
        accountClient.list(),
        incomeClient.list(),
        expenseClient.list(),
        debtClient.list(),
        transferClient.list(),
        trackerClient.list(),
        propertyClient.list(),
        snapshotClient.list(),
      ]);
      setAccounts(accountList);
      setTrackers(trackerList);
      setProperties(propertyList);
      setSnapshots(snapshotList);
      setRawProfile(apiProfile);
      setProfile({
        age: calculateAge(apiProfile.birthDate),
        incomes: apiIncomes.map(toIncomeSource),
        expenses: apiExpenses.map(toExpenseItem),
        debts: apiDebts.map(toDebt),
        transfers,
        emergencyFund: { targetMonths: apiProfile.emergencyFundTargetMonths },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    profile,
    rawProfile,
    accounts,
    trackers,
    properties,
    snapshots,
    loading,
    error,
    updateProfile: async (entity: Profile) => {
      await profileClient.update(entity);
      await reload();
    },
    addAccount: async (entity: NewAccount) => {
      await accountClient.create(entity);
      await reload();
    },
    removeAccount: async (id: string) => {
      await accountClient.remove(id);
      await reload();
    },
    addIncome: async (entity: NewIncomeSource) => {
      await incomeClient.create(toApiIncome(entity));
      await reload();
    },
    updateIncome: async (id: string, entity: NewIncomeSource) => {
      await incomeClient.update(id, toApiIncome(entity));
      await reload();
    },
    removeIncome: async (id: string) => {
      await incomeClient.remove(id);
      await reload();
    },
    addExpense: async (entity: NewExpenseItem) => {
      await expenseClient.create(toApiExpense(entity));
      await reload();
    },
    removeExpense: async (id: string) => {
      await expenseClient.remove(id);
      await reload();
    },
    addDebt: async (entity: NewDebt) => {
      await debtClient.create(toApiDebt(entity));
      await reload();
    },
    removeDebt: async (id: string) => {
      await debtClient.remove(id);
      await reload();
    },
    addTransfer: async (entity: NewTransfer) => {
      await transferClient.create(entity);
      await reload();
    },
    removeTransfer: async (id: string) => {
      await transferClient.remove(id);
      await reload();
    },
    addTracker: async (entity: NewSavingsTracker) => {
      await trackerClient.create(entity);
      await reload();
    },
    updateTracker: async (id: string, entity: NewSavingsTracker) => {
      await trackerClient.update(id, entity);
      await reload();
    },
    removeTracker: async (id: string) => {
      await trackerClient.remove(id);
      await reload();
    },
    addProperty: async (entity: NewProperty) => {
      await propertyClient.create(entity);
      await reload();
    },
    updateProperty: async (id: string, entity: NewProperty) => {
      await propertyClient.update(id, entity);
      await reload();
    },
    removeProperty: async (id: string) => {
      await propertyClient.remove(id);
      await reload();
    },
    addSnapshot: async (entity: NewSnapshot) => {
      await snapshotClient.create(entity);
      await reload();
    },
    updateSnapshot: async (id: string, entity: NewSnapshot) => {
      await snapshotClient.update(id, entity);
      await reload();
    },
    removeSnapshot: async (id: string) => {
      await snapshotClient.remove(id);
      await reload();
    },
  };
}
