import { describe, expect, it } from "vitest";
import type { FlujoPositions } from "../domain/types.js";
import type { FlujoPositionsRepository } from "../infrastructure/db/repositories/flujoPositionsRepository.js";
import { callAsync } from "../test/callAsync.js";
import { createFlujoPositionsUseCases } from "./flujoPositions.js";

function createFakeFlujoPositionsRepository(initial: FlujoPositions = {}): FlujoPositionsRepository {
  let current = initial;
  return {
    async get() {
      return current;
    },
    async update(positions) {
      current = positions;
      return current;
    },
  };
}

describe("createFlujoPositionsUseCases", () => {
  it("devuelve un objeto vacío si todavía no se ha guardado nada", async () => {
    const useCases = createFlujoPositionsUseCases(createFakeFlujoPositionsRepository());
    expect(await useCases.get()).toEqual({});
  });

  it("guarda posiciones válidas", async () => {
    const useCases = createFlujoPositionsUseCases(createFakeFlujoPositionsRepository());
    const updated = await useCases.update({ "account-BBVA": { x: 12.5, y: -30 } });
    expect(updated).toEqual({ "account-BBVA": { x: 12.5, y: -30 } });
  });

  it("rechaza una posición con coordenadas no numéricas", async () => {
    const useCases = createFlujoPositionsUseCases(createFakeFlujoPositionsRepository());
    await expect(
      // @ts-expect-error -- x inválido a propósito
      callAsync(() => useCases.update({ "account-BBVA": { x: "no", y: 0 } })),
    ).rejects.toThrow("Posición inválida");
  });

  it("rechaza un valor que no es un objeto", async () => {
    const useCases = createFlujoPositionsUseCases(createFakeFlujoPositionsRepository());
    // @ts-expect-error -- valor inválido a propósito
    await expect(callAsync(() => useCases.update(null))).rejects.toThrow("deben ser un objeto");
  });
});
