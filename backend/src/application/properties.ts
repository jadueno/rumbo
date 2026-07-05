import type { Repository } from "../domain/ports.js";
import type { NewProperty, Property } from "../domain/types.js";
import { assertNonEmpty, assertNonNegativeAmount } from "./errors.js";

function validate(entity: NewProperty): void {
  assertNonEmpty(entity.name, "El nombre de la propiedad");
  assertNonNegativeAmount(entity.estimatedValue, "El valor estimado");
}

export function createPropertyUseCases(repo: Repository<Property, NewProperty>) {
  return {
    list: () => repo.list(),
    create: (entity: NewProperty) => {
      validate(entity);
      return repo.create(entity);
    },
    update: (id: string, entity: NewProperty) => {
      validate(entity);
      return repo.update(id, entity);
    },
    remove: (id: string) => repo.remove(id),
  };
}
