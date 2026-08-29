import type { FastifyInstance } from "fastify";
import type { createFlujoPositionsUseCases } from "../../application/flujoPositions.js";
import type { FlujoPositions } from "../../domain/types.js";
import { handleError } from "./crudRoutes.js";

/** Singleton: GET/PUT sin id, igual que /profile. */
export function registerFlujoPositionsRoutes(
  app: FastifyInstance,
  useCases: ReturnType<typeof createFlujoPositionsUseCases>,
): void {
  app.get("/flujo-positions", async () => useCases.get());

  app.put("/flujo-positions", async (request, reply) => {
    try {
      const updated = await useCases.update(request.body as FlujoPositions);
      reply.send(updated);
    } catch (error) {
      handleError(error, reply);
    }
  });
}
