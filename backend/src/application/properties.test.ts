import { describe, expect, it } from "vitest";
import type { NewProperty, Property } from "../domain/types.js";
import { callAsync } from "../test/callAsync.js";
import { createFakeRepository } from "../test/fakeRepository.js";
import { createPropertyUseCases } from "./properties.js";

function validProperty(overrides: Partial<NewProperty> = {}): NewProperty {
  return { name: "Piso Riviera", estimatedValue: 200000, ...overrides };
}

describe("createPropertyUseCases", () => {
  it("crea una propiedad válida", async () => {
    const useCases = createPropertyUseCases(createFakeRepository<Property, NewProperty>());
    const created = await useCases.create(validProperty());
    expect(created).toMatchObject(validProperty());
  });

  it("rechaza un nombre vacío", async () => {
    const useCases = createPropertyUseCases(createFakeRepository<Property, NewProperty>());
    await expect(callAsync(() => useCases.create(validProperty({ name: "" })))).rejects.toThrow(
      "El nombre de la propiedad",
    );
  });

  it("rechaza un valor estimado negativo", async () => {
    const useCases = createPropertyUseCases(createFakeRepository<Property, NewProperty>());
    await expect(callAsync(() => useCases.create(validProperty({ estimatedValue: -1 })))).rejects.toThrow(
      "El valor estimado",
    );
  });
});
