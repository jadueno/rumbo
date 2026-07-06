import { describe, expect, it } from "vitest";
import type { Expense, NewExpense } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createExpenseUseCases } from "./expenses.js";

function validExpense(overrides: Partial<NewExpense> = {}): NewExpense {
  return { category: "Fijos", account: "ING", property: null, label: "Alquiler", monthlyAmount: 500, ...overrides };
}

describe("createExpenseUseCases", () => {
  it("crea un gasto válido", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    const created = await useCases.create(validExpense());
    expect(created).toMatchObject(validExpense());
  });

  it("rechaza una categoría que no sea Fijos, Variables o Autónomo", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    await expect(
      callAsync(() => useCases.create(validExpense({ category: "Otra" as NewExpense["category"] }))),
    ).rejects.toThrow("La categoría debe ser una de");
  });

  it("rechaza una cuenta vacía", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    await expect(callAsync(() => useCases.create(validExpense({ account: "" })))).rejects.toThrow("La cuenta");
  });

  it("rechaza un concepto vacío", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    await expect(callAsync(() => useCases.create(validExpense({ label: "" })))).rejects.toThrow("El concepto");
  });

  it("rechaza un importe negativo", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    await expect(callAsync(() => useCases.create(validExpense({ monthlyAmount: -1 })))).rejects.toThrow(
      "El importe mensual",
    );
  });

  it("borra un gasto", async () => {
    const useCases = createExpenseUseCases(createFakeRepository<Expense, NewExpense>());
    const created = await useCases.create(validExpense());
    expect(await useCases.remove(created.id)).toBe(true);
  });
});
