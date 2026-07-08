import type { ProfileRepository } from "../infrastructure/db/repositories/profileRepository.js";
import type { Profile } from "../domain/types.js";
import { assertNonEmpty, ValidationError } from "./errors.js";

const BIRTH_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(entity: Profile): void {
  assertNonEmpty(entity.name, "El nombre");

  if (!BIRTH_DATE_RE.test(entity.birthDate) || Number.isNaN(new Date(entity.birthDate).getTime())) {
    throw new ValidationError("La fecha de nacimiento no es válida");
  }
  if (new Date(entity.birthDate).getTime() > Date.now()) {
    throw new ValidationError("La fecha de nacimiento no puede ser futura");
  }

  if (!Number.isInteger(entity.emergencyFundTargetMonths) || entity.emergencyFundTargetMonths <= 0) {
    throw new ValidationError("El objetivo del fondo de emergencia debe ser un número entero de meses mayor que 0");
  }
}

export function createProfileUseCases(repo: ProfileRepository) {
  return {
    get: () => repo.get(),
    update: (entity: Profile) => {
      validate(entity);
      return repo.update(entity);
    },
  };
}
