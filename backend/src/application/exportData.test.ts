import { describe, expect, it } from "vitest";
import { createExportUseCases } from "./exportData.js";

function listable<T>(items: T[]) {
  return { list: async () => items };
}

describe("createExportUseCases", () => {
  it("junta todos los recursos en un único export con fecha", async () => {
    const useCases = createExportUseCases({
      accounts: listable([{ id: "1", name: "ING" }]),
      incomes: listable([{ id: "1", account: "ING", label: "Salario", monthlyAmount: 2000, property: null }]),
      expenses: listable([]),
      debts: listable([]),
      transfers: listable([]),
      savingsTrackers: listable([]),
      properties: listable([]),
    });

    const result = await useCases.exportAll();

    expect(result.accounts).toHaveLength(1);
    expect(result.incomes).toHaveLength(1);
    expect(result.expenses).toEqual([]);
    expect(new Date(result.exportedAt).toString()).not.toBe("Invalid Date");
  });
});
