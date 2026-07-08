import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerBackupRoutes } from "./backupRoutes.js";

describe("registerBackupRoutes", () => {
  it("responde 200 con los datos del backup si tiene éxito", async () => {
    const app = Fastify({ logger: false });
    registerBackupRoutes(app, async () => ({ file: "/tmp/salud_financiera_x.dump.gz", sizeBytes: 1234 }));

    const res = await app.inject({ method: "POST", url: "/backup" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ file: "/tmp/salud_financiera_x.dump.gz", sizeBytes: 1234 });
    expect(res.json().at).toBeDefined();
  });

  it("responde 500 con un mensaje claro si el backup falla, sin tumbar el servidor", async () => {
    const app = Fastify({ logger: false });
    registerBackupRoutes(app, async () => {
      throw new Error("docker no está corriendo");
    });

    const res = await app.inject({ method: "POST", url: "/backup" });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toContain("docker no está corriendo");
  });
});
