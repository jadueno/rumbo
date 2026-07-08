import { describe, expect, it } from "vitest";
import type { Profile } from "../domain/types.js";
import type { ProfileRepository } from "../infrastructure/db/repositories/profileRepository.js";
import { callAsync } from "../test/callAsync.js";
import { createProfileUseCases } from "./profile.js";

function validProfile(overrides: Partial<Profile> = {}): Profile {
  return { name: "Juan", birthDate: "1985-06-15", emergencyFundTargetMonths: 3, ...overrides };
}

function createFakeProfileRepository(initial: Profile): ProfileRepository {
  let current = initial;
  return {
    async get() {
      return current;
    },
    async update(entity) {
      current = entity;
      return current;
    },
  };
}

describe("createProfileUseCases", () => {
  it("actualiza un perfil válido", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    const updated = await useCases.update(validProfile({ name: "María" }));
    expect(updated.name).toBe("María");
  });

  it("rechaza un nombre vacío", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    await expect(callAsync(() => useCases.update(validProfile({ name: "" })))).rejects.toThrow(
      "no puede estar vacío",
    );
  });

  it("rechaza una fecha de nacimiento con formato inválido", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    await expect(
      callAsync(() => useCases.update(validProfile({ birthDate: "15/06/1985" }))),
    ).rejects.toThrow("fecha de nacimiento no es válida");
  });

  it("rechaza una fecha de nacimiento futura", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    await expect(
      callAsync(() => useCases.update(validProfile({ birthDate: "2099-01-01" }))),
    ).rejects.toThrow("no puede ser futura");
  });

  it("rechaza un objetivo de fondo de emergencia menor o igual a 0", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    await expect(
      callAsync(() => useCases.update(validProfile({ emergencyFundTargetMonths: 0 }))),
    ).rejects.toThrow("mayor que 0");
  });

  it("rechaza un objetivo de fondo de emergencia no entero", async () => {
    const useCases = createProfileUseCases(createFakeProfileRepository(validProfile()));
    await expect(
      callAsync(() => useCases.update(validProfile({ emergencyFundTargetMonths: 2.5 }))),
    ).rejects.toThrow("mayor que 0");
  });
});
