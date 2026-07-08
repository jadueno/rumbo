import type { FastifyInstance } from "fastify";
import type { BackupResult } from "../backup.js";

/**
 * `runBackup` se recibe como parámetro (en vez de importarlo aquí dentro) para poder
 * inyectar un fake en los tests — el backup real depende de Docker/pg_dump y no tiene
 * sentido ejecutarlo de verdad en la suite automática (ni funcionaría en CI).
 */
export function registerBackupRoutes(app: FastifyInstance, runBackup: () => Promise<BackupResult>): void {
  app.post("/backup", async (_request, reply) => {
    try {
      const result = await runBackup();
      reply.send({ ...result, at: new Date().toISOString() });
    } catch (error) {
      app.log.error(error, "El backup bajo demanda ha fallado");
      reply.code(500).send({
        error: error instanceof Error ? error.message : "No se ha podido hacer la copia de seguridad",
      });
    }
  });
}
