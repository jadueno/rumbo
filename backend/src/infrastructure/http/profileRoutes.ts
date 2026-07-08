import type { FastifyInstance } from "fastify";
import type { createProfileUseCases } from "../../application/profile.js";
import type { Profile } from "../../domain/types.js";
import { handleError } from "./crudRoutes.js";

/** Singleton: GET/PUT sin id, a diferencia del resto de recursos CRUD. */
export function registerProfileRoutes(app: FastifyInstance, useCases: ReturnType<typeof createProfileUseCases>): void {
  app.get("/profile", async () => useCases.get());

  app.put("/profile", async (request, reply) => {
    try {
      const updated = await useCases.update(request.body as Profile);
      reply.send(updated);
    } catch (error) {
      handleError(error, reply);
    }
  });
}
