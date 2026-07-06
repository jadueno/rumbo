import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTestPool, resetDatabase } from "../../test/testPool.js";
import { buildServer } from "./server.js";

let pool: Pool;
let app: FastifyInstance;

beforeAll(async () => {
  pool = createTestPool();
  app = await buildServer(pool, { logger: false });
});

afterEach(async () => {
  await resetDatabase(pool);
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe("GET /health", () => {
  it("responde ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});

describe("/accounts", () => {
  it("crea, lista y borra una cuenta", async () => {
    const create = await app.inject({ method: "POST", url: "/accounts", payload: { name: "ING" } });
    expect(create.statusCode).toBe(201);
    const account = create.json();
    expect(account.name).toBe("ING");

    const list = await app.inject({ method: "GET", url: "/accounts" });
    expect(list.json()).toEqual([account]);

    const remove = await app.inject({ method: "DELETE", url: `/accounts/${account.id}` });
    expect(remove.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/accounts" })).json()).toEqual([]);
  });

  it("responde 400 con un nombre vacío", async () => {
    const res = await app.inject({ method: "POST", url: "/accounts", payload: { name: "" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("no puede estar vacío");
  });

  it("no permite borrar una cuenta con gastos asociados", async () => {
    const account = (await app.inject({ method: "POST", url: "/accounts", payload: { name: "ING" } })).json();
    await app.inject({
      method: "POST",
      url: "/expenses",
      payload: { category: "Fijos", account: "ING", property: null, label: "Alquiler", monthlyAmount: 500 },
    });

    const remove = await app.inject({ method: "DELETE", url: `/accounts/${account.id}` });
    expect(remove.statusCode).toBe(400);
    expect(remove.json().error).toContain("1 movimiento(s)");
  });

  it("responde 404 al borrar una cuenta inexistente", async () => {
    const res = await app.inject({ method: "DELETE", url: "/accounts/00000000-0000-0000-0000-000000000000" });
    expect(res.statusCode).toBe(404);
  });
});

describe("/expenses (rutas CRUD genéricas)", () => {
  const payload = { category: "Fijos", account: "ING", property: null, label: "Alquiler", monthlyAmount: 500 };

  it("crea, actualiza y borra un gasto", async () => {
    const create = await app.inject({ method: "POST", url: "/expenses", payload });
    expect(create.statusCode).toBe(201);
    const expense = create.json();
    expect(expense).toMatchObject(payload);

    const update = await app.inject({
      method: "PUT",
      url: `/expenses/${expense.id}`,
      payload: { ...payload, monthlyAmount: 600 },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().monthlyAmount).toBe(600);

    const remove = await app.inject({ method: "DELETE", url: `/expenses/${expense.id}` });
    expect(remove.statusCode).toBe(204);
  });

  it("responde 400 con una categoría inválida", async () => {
    const res = await app.inject({ method: "POST", url: "/expenses", payload: { ...payload, category: "Otra" } });
    expect(res.statusCode).toBe(400);
  });

  it("responde 404 al actualizar un gasto inexistente", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/expenses/00000000-0000-0000-0000-000000000000",
      payload,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("/savings-trackers", () => {
  const emergencyFund = {
    kind: "emergency_fund",
    name: "Fondo",
    account: "ING - Ahorro",
    initialBalance: 1000,
    initialBalanceAsOf: "2026-01",
  };

  it("no permite un segundo fondo de emergencia de punta a punta (aplicación + restricción de BD)", async () => {
    const first = await app.inject({ method: "POST", url: "/savings-trackers", payload: emergencyFund });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/savings-trackers",
      payload: { ...emergencyFund, account: "Ibercaja" },
    });
    expect(second.statusCode).toBe(400);
    expect(second.json().error).toContain("Ya existe un fondo de emergencia");
  });
});

describe("GET /export", () => {
  it("junta todos los recursos", async () => {
    await app.inject({ method: "POST", url: "/accounts", payload: { name: "ING" } });
    const res = await app.inject({ method: "GET", url: "/export" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body).toHaveProperty("exportedAt");
  });
});
