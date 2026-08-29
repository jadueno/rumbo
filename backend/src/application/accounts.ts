import type { AccountRepository } from "../infrastructure/db/repositories/accountRepository.js";
import type { NewAccount } from "../domain/types.js";
import { assertNonEmpty } from "./errors.js";

export function createAccountUseCases(repo: AccountRepository) {
  return {
    list: () => repo.list(),

    create: (entity: NewAccount) => {
      assertNonEmpty(entity.name, "El nombre de la cuenta");
      return repo.create({ name: entity.name.trim() });
    },

    /** Renombrar la cuenta actualiza en cascada su nombre en ingresos, gastos, transferencias
     * y seguimientos de ahorro/inversión (ver AccountRepository.update). */
    update: (id: string, entity: NewAccount) => {
      assertNonEmpty(entity.name, "El nombre de la cuenta");
      return repo.update(id, { name: entity.name.trim() });
    },

    /** Borra la cuenta en cascada junto con sus ingresos, gastos, transferencias y
     * seguimientos de ahorro/inversión asociados (ver AccountRepository.remove). */
    remove: (id: string) => repo.remove(id),
  };
}
