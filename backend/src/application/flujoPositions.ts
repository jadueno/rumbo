import type { FlujoPositionsRepository } from "../infrastructure/db/repositories/flujoPositionsRepository.js";
import type { FlujoPositions } from "../domain/types.js";
import { ValidationError } from "./errors.js";

function validate(positions: FlujoPositions): void {
  if (typeof positions !== "object" || positions === null || Array.isArray(positions)) {
    throw new ValidationError("Las posiciones deben ser un objeto");
  }
  for (const [nodeId, pos] of Object.entries(positions)) {
    if (typeof pos !== "object" || pos === null || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
      throw new ValidationError(`Posición inválida para "${nodeId}"`);
    }
  }
}

export function createFlujoPositionsUseCases(repo: FlujoPositionsRepository) {
  return {
    get: () => repo.get(),
    update: (positions: FlujoPositions) => {
      validate(positions);
      return repo.update(positions);
    },
  };
}
