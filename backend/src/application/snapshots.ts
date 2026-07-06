import type { Repository } from "../domain/ports.js";
import type { NewSnapshot, Snapshot } from "../domain/types.js";
import { ValidationError } from "./errors.js";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function validate(entity: NewSnapshot): void {
  if (!MONTH_RE.test(entity.month)) {
    throw new ValidationError('El mes debe tener el formato "YYYY-MM" (p. ej. "2026-07")');
  }
  if (!Number.isFinite(entity.netWorth)) {
    throw new ValidationError("El patrimonio debe ser un número");
  }
  if (!Number.isFinite(entity.savingsRate)) {
    throw new ValidationError("La tasa de ahorro debe ser un número");
  }
  if (!Number.isInteger(entity.healthScore) || entity.healthScore < 0 || entity.healthScore > 100) {
    throw new ValidationError("El score debe ser un entero entre 0 y 100");
  }
}

export function createSnapshotUseCases(repo: Repository<Snapshot, NewSnapshot>) {
  async function assertMonthFree(month: string, excludeId?: string): Promise<void> {
    const existing = await repo.list();
    const conflict = existing.find((s) => s.id !== excludeId && s.month === month);
    if (conflict) {
      throw new ValidationError(`Ya existe un snapshot para ${month}. Bórralo primero o actualízalo.`);
    }
  }

  return {
    list: () => repo.list(),

    create: async (entity: NewSnapshot) => {
      validate(entity);
      await assertMonthFree(entity.month);
      return repo.create(entity);
    },

    update: async (id: string, entity: NewSnapshot) => {
      validate(entity);
      await assertMonthFree(entity.month, id);
      return repo.update(id, entity);
    },

    remove: (id: string) => repo.remove(id),
  };
}
