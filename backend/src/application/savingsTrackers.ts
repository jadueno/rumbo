import type { Repository } from "../domain/ports.js";
import type { NewSavingsTracker, SavingsTracker } from "../domain/types.js";
import { assertNonEmpty, assertNonNegativeAmount, ValidationError } from "./errors.js";

const validKinds = ["emergency_fund", "investment"];

function validate(entity: NewSavingsTracker): void {
  if (!validKinds.includes(entity.kind)) {
    throw new ValidationError(`El tipo debe ser uno de: ${validKinds.join(", ")}`);
  }
  assertNonEmpty(entity.name, "El nombre");
  assertNonEmpty(entity.account, "La cuenta");
  assertNonEmpty(entity.initialBalanceAsOf, "El mes de partida");
  assertNonNegativeAmount(entity.initialBalance, "El saldo inicial");
}

export function createSavingsTrackerUseCases(repo: Repository<SavingsTracker, NewSavingsTracker>) {
  return {
    list: () => repo.list(),

    create: async (entity: NewSavingsTracker) => {
      validate(entity);
      if (entity.kind === "emergency_fund") {
        const existing = await repo.list();
        if (existing.some((t) => t.kind === "emergency_fund")) {
          throw new ValidationError("Ya existe un fondo de emergencia. Bórralo primero si quieres cambiar de cuenta.");
        }
      }
      return repo.create(entity);
    },

    update: (id: string, entity: NewSavingsTracker) => {
      validate(entity);
      return repo.update(id, entity);
    },

    remove: (id: string) => repo.remove(id),
  };
}
