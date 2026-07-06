import { describe, expect, it } from "vitest";
import type { Debt, NewDebt } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createDebtUseCases } from "./debts.js";

function validDebt(overrides: Partial<NewDebt> = {}): NewDebt {
  return {
    name: "Hipoteca",
    monthlyPayment: 400,
    dueDate: "2040-01",
    remainingBalance: null,
    balanceAsOf: null,
    ...overrides,
  };
}

describe("createDebtUseCases", () => {
  it("crea una deuda válida", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    const created = await useCases.create(validDebt());
    expect(created).toMatchObject(validDebt());
  });

  it("rechaza un nombre vacío", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    await expect(callAsync(() => useCases.create(validDebt({ name: "" })))).rejects.toThrow("El nombre");
  });

  it("rechaza una fecha de fin vacía", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    await expect(callAsync(() => useCases.create(validDebt({ dueDate: "" })))).rejects.toThrow("La fecha de fin");
  });

  it("rechaza una cuota mensual negativa", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    await expect(callAsync(() => useCases.create(validDebt({ monthlyPayment: -100 })))).rejects.toThrow(
      "La cuota mensual",
    );
  });

  it("acepta remainingBalance null (no aplica todavía)", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    const created = await useCases.create(validDebt({ remainingBalance: null }));
    expect(created.remainingBalance).toBeNull();
  });

  it("rechaza un remainingBalance negativo cuando sí se informa", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    await expect(
      callAsync(() => useCases.create(validDebt({ remainingBalance: -1, balanceAsOf: "2026-01" }))),
    ).rejects.toThrow("El saldo pendiente");
  });

  it("borra una deuda", async () => {
    const useCases = createDebtUseCases(createFakeRepository<Debt, NewDebt>());
    const created = await useCases.create(validDebt());
    expect(await useCases.remove(created.id)).toBe(true);
  });
});
