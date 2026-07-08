import { describe, expect, it } from "vitest";
import type { Income, NewIncome } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createIncomeUseCases } from "./incomes.js";

function validIncome(overrides: Partial<NewIncome> = {}): NewIncome {
  return { account: "Nómina", label: "Salario", monthlyAmount: 2000, property: null, propertyId: null, ...overrides };
}

describe("createIncomeUseCases", () => {
  it("crea un ingreso válido", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    const created = await useCases.create(validIncome());
    expect(created).toMatchObject(validIncome());
  });

  it("rechaza una cuenta vacía", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    await expect(callAsync(() => useCases.create(validIncome({ account: "" })))).rejects.toThrow("La cuenta");
  });

  it("rechaza un concepto vacío", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    await expect(callAsync(() => useCases.create(validIncome({ label: "" })))).rejects.toThrow("El concepto");
  });

  it("rechaza un importe negativo", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    await expect(callAsync(() => useCases.create(validIncome({ monthlyAmount: -1 })))).rejects.toThrow(
      "El importe mensual",
    );
  });

  it("actualiza validando igual que al crear", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    const created = await useCases.create(validIncome());
    await expect(
      callAsync(() => useCases.update(created.id, validIncome({ monthlyAmount: -5 }))),
    ).rejects.toThrow();
    const updated = await useCases.update(created.id, validIncome({ monthlyAmount: 2500 }));
    expect(updated?.monthlyAmount).toBe(2500);
  });

  it("borra un ingreso", async () => {
    const useCases = createIncomeUseCases(createFakeRepository<Income, NewIncome>());
    const created = await useCases.create(validIncome());
    expect(await useCases.remove(created.id)).toBe(true);
    expect(await useCases.list()).toHaveLength(0);
  });
});
