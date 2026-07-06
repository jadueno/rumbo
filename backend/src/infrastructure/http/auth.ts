import type { FastifyInstance } from "fastify";

/**
 * Autenticación opcional por token fijo (bearer). Si no hay `token`, no registra nada:
 * el uso personal por Tailscale sigue sin fricción. Si lo hay, exige
 * `Authorization: Bearer <token>` en todas las rutas salvo `/health`.
 */
export function registerAuth(app: FastifyInstance, token: string | undefined): void {
  if (!token) return;

  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health") return;
    if (request.headers.authorization !== `Bearer ${token}`) {
      reply.code(401).send({ error: "No autorizado" });
    }
  });
}
