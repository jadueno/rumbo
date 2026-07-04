import type { FastifyInstance } from "fastify";
import type { createAccountUseCases } from "../../application/accounts.js";
import { handleError } from "./crudRoutes.js";

export function registerAccountRoutes(
  app: FastifyInstance,
  useCases: ReturnType<typeof createAccountUseCases>,
): void {
  app.get("/accounts", async () => useCases.list());

  app.post("/accounts", async (request, reply) => {
    try {
      const created = await useCases.create(request.body as { name: string });
      reply.code(201).send(created);
    } catch (error) {
      handleError(error, reply);
    }
  });

  app.delete("/accounts/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const removed = await useCases.remove(id);
      if (!removed) {
        reply.code(404).send({ error: "No encontrado" });
        return;
      }
      reply.code(204).send();
    } catch (error) {
      handleError(error, reply);
    }
  });
}
