import { describe, expect, it } from "vitest";
import type { NewTransfer, Transfer } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createTransferUseCases } from "./transfers.js";

function validTransfer(overrides: Partial<NewTransfer> = {}): NewTransfer {
  return { fromAccount: "Nómina", toAccount: "Ahorro", monthlyAmount: 300, ...overrides };
}

describe("createTransferUseCases", () => {
  it("crea una transferencia válida", async () => {
    const useCases = createTransferUseCases(createFakeRepository<Transfer, NewTransfer>());
    const created = await useCases.create(validTransfer());
    expect(created).toMatchObject(validTransfer());
  });

  it("rechaza origen y destino iguales", async () => {
    const useCases = createTransferUseCases(createFakeRepository<Transfer, NewTransfer>());
    await expect(
      callAsync(() => useCases.create(validTransfer({ fromAccount: "Nómina", toAccount: "Nómina" }))),
    ).rejects.toThrow("la misma cuenta");
  });

  it("rechaza cuentas vacías", async () => {
    const useCases = createTransferUseCases(createFakeRepository<Transfer, NewTransfer>());
    await expect(callAsync(() => useCases.create(validTransfer({ fromAccount: "" })))).rejects.toThrow(
      "cuenta de origen",
    );
    await expect(callAsync(() => useCases.create(validTransfer({ toAccount: "" })))).rejects.toThrow(
      "cuenta de destino",
    );
  });

  it("rechaza un importe negativo", async () => {
    const useCases = createTransferUseCases(createFakeRepository<Transfer, NewTransfer>());
    await expect(callAsync(() => useCases.create(validTransfer({ monthlyAmount: -10 })))).rejects.toThrow(
      "El importe mensual",
    );
  });
});
