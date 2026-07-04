import type { AccountRepository } from "../infrastructure/db/repositories/accountRepository.js";
import type { NewAccount } from "../domain/types.js";
import { assertNonEmpty, ValidationError } from "./errors.js";

export function createAccountUseCases(repo: AccountRepository) {
  return {
    list: () => repo.list(),

    create: (entity: NewAccount) => {
      assertNonEmpty(entity.name, "El nombre de la cuenta");
      return repo.create({ name: entity.name.trim() });
    },

    remove: async (id: string) => {
      const account = await repo.findById(id);
      if (!account) return false;

      const usages = await repo.countUsages(account.name);
      if (usages > 0) {
        throw new ValidationError(
          `No se puede borrar "${account.name}": tiene ${usages} movimiento(s) asociados. Bórralos primero.`,
        );
      }
      return repo.remove(id);
    },
  };
}
