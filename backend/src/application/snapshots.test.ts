import { describe, expect, it } from "vitest";
import type { NewSnapshot, Snapshot } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createSnapshotUseCases } from "./snapshots.js";

function validSnapshot(overrides: Partial<NewSnapshot> = {}): NewSnapshot {
  return { month: "2026-06", netWorth: 50000, savingsRate: 0.22, healthScore: 72, ...overrides };
}

describe("createSnapshotUseCases", () => {
  it("crea un snapshot válido", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    const created = await useCases.create(validSnapshot());
    expect(created).toMatchObject(validSnapshot());
  });

  it("rechaza un mes con formato distinto de YYYY-MM", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    await expect(callAsync(() => useCases.create(validSnapshot({ month: "junio-2026" })))).rejects.toThrow(
      "YYYY-MM",
    );
  });

  it("rechaza un score fuera de 0-100 o no entero", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    await expect(callAsync(() => useCases.create(validSnapshot({ healthScore: 101 })))).rejects.toThrow(
      "entre 0 y 100",
    );
    await expect(callAsync(() => useCases.create(validSnapshot({ healthScore: 55.5 })))).rejects.toThrow(
      "entre 0 y 100",
    );
  });

  it("no permite dos snapshots para el mismo mes", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    await useCases.create(validSnapshot({ month: "2026-06" }));
    await expect(callAsync(() => useCases.create(validSnapshot({ month: "2026-06" })))).rejects.toThrow(
      "Ya existe un snapshot para 2026-06",
    );
  });

  it("al actualizar, permite conservar el mismo mes que ya tenía ese snapshot", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    const created = await useCases.create(validSnapshot({ month: "2026-06" }));
    const updated = await useCases.update(created.id, validSnapshot({ month: "2026-06", netWorth: 51000 }));
    expect(updated?.netWorth).toBe(51000);
  });

  it("borra un snapshot", async () => {
    const useCases = createSnapshotUseCases(createFakeRepository<Snapshot, NewSnapshot>());
    const created = await useCases.create(validSnapshot());
    expect(await useCases.remove(created.id)).toBe(true);
  });
});
