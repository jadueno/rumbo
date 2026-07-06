import { describe, expect, it } from "vitest";
import type { NewSavingsTracker, SavingsTracker } from "../domain/types.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createSavingsTrackerUseCases } from "./savingsTrackers.js";

function validTracker(overrides: Partial<NewSavingsTracker> = {}): NewSavingsTracker {
  return {
    kind: "emergency_fund",
    name: "Fondo",
    account: "ING - Ahorro",
    initialBalance: 1000,
    initialBalanceAsOf: "2026-01",
    ...overrides,
  };
}

describe("createSavingsTrackerUseCases", () => {
  it("crea un seguimiento válido", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    const created = await useCases.create(validTracker());
    expect(created).toMatchObject(validTracker());
  });

  it("rechaza un tipo que no sea emergency_fund o investment", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    await expect(
      useCases.create(validTracker({ kind: "otro" as SavingsTracker["kind"] })),
    ).rejects.toThrow("El tipo debe ser uno de");
  });

  it("no permite un segundo fondo de emergencia", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    await useCases.create(validTracker({ account: "ING - Ahorro" }));
    await expect(
      useCases.create(validTracker({ account: "Ibercaja" })),
    ).rejects.toThrow("Ya existe un fondo de emergencia");
  });

  it("permite varios seguimientos de inversión", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    await useCases.create(validTracker({ kind: "investment", name: "Cartera 1", account: "MyInvestor A" }));
    const second = await useCases.create(
      validTracker({ kind: "investment", name: "Cartera 2", account: "MyInvestor B" }),
    );
    expect(second.name).toBe("Cartera 2");
  });

  it("no permite vincular dos seguimientos a la misma cuenta", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    await useCases.create(validTracker({ kind: "investment", name: "Cartera 1", account: "MyInvestor" }));
    await expect(
      useCases.create(validTracker({ kind: "investment", name: "Cartera 2", account: "MyInvestor" })),
    ).rejects.toThrow("ya está vinculada a otro seguimiento");
  });

  it("al actualizar, permite conservar la misma cuenta que ya tenía ese seguimiento", async () => {
    const useCases = createSavingsTrackerUseCases(createFakeRepository<SavingsTracker, NewSavingsTracker>());
    const created = await useCases.create(validTracker({ account: "ING - Ahorro" }));
    const updated = await useCases.update(created.id, validTracker({ account: "ING - Ahorro", initialBalance: 2000 }));
    expect(updated?.initialBalance).toBe(2000);
  });
});
