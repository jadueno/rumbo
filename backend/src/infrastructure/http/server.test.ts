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

// `profile` no se trunca en resetDatabase (ver testPool.ts): es una tabla singleton
// sembrada una única vez por la migración de seed, no una colección de fixtures de test.
describe("/profile", () => {
  it("lee y actualiza el perfil", async () => {
    const update = await app.inject({
      method: "PUT",
      url: "/profile",
      payload: { name: "Ana", birthDate: "1990-03-20", emergencyFundTargetMonths: 6 },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toEqual({ name: "Ana", birthDate: "1990-03-20", emergencyFundTargetMonths: 6 });

    const get = await app.inject({ method: "GET", url: "/profile" });
    expect(get.json()).toEqual({ name: "Ana", birthDate: "1990-03-20", emergencyFundTargetMonths: 6 });
  });

  it("responde 400 con una fecha de nacimiento futura", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/profile",
      payload: { name: "Ana", birthDate: "2099-01-01", emergencyFundTargetMonths: 6 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("no puede ser futura");
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

  it("al borrar una cuenta, borra en cascada sus ingresos, gastos, transferencias y seguimientos de ahorro", async () => {
    const account = (await app.inject({ method: "POST", url: "/accounts", payload: { name: "ING" } })).json();
    await app.inject({ method: "POST", url: "/accounts", payload: { name: "Ibercaja" } });

    const income = (
      await app.inject({
        method: "POST",
        url: "/incomes",
        payload: { account: "ING", label: "Nómina", monthlyAmount: 2000, property: null },
      })
    ).json();
    const expense = (
      await app.inject({
        method: "POST",
        url: "/expenses",
        payload: { category: "Fijos", account: "ING", property: null, label: "Alquiler", monthlyAmount: 500 },
      })
    ).json();
    const transfer = (
      await app.inject({
        method: "POST",
        url: "/transfers",
        payload: { fromAccount: "ING", toAccount: "Ibercaja", monthlyAmount: 100 },
      })
    ).json();
    const tracker = (
      await app.inject({
        method: "POST",
        url: "/savings-trackers",
        payload: {
          kind: "emergency_fund",
          name: "Fondo",
          account: "ING",
          initialBalance: 1000,
          initialBalanceAsOf: "2026-01",
        },
      })
    ).json();

    const remove = await app.inject({ method: "DELETE", url: `/accounts/${account.id}` });
    expect(remove.statusCode).toBe(204);

    expect((await app.inject({ method: "GET", url: "/incomes" })).json()).not.toContainEqual(
      expect.objectContaining({ id: income.id }),
    );
    expect((await app.inject({ method: "GET", url: "/expenses" })).json()).not.toContainEqual(
      expect.objectContaining({ id: expense.id }),
    );
    expect((await app.inject({ method: "GET", url: "/transfers" })).json()).not.toContainEqual(
      expect.objectContaining({ id: transfer.id }),
    );
    expect((await app.inject({ method: "GET", url: "/savings-trackers" })).json()).not.toContainEqual(
      expect.objectContaining({ id: tracker.id }),
    );
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

describe("autenticación opcional (API_TOKEN), de extremo a extremo con el servidor real", () => {
  it("con apiToken configurado, exige el token también en las rutas ya montadas", async () => {
    const authedApp = await buildServer(pool, { logger: false, apiToken: "demo-token" });

    const withoutToken = await authedApp.inject({ method: "GET", url: "/accounts" });
    expect(withoutToken.statusCode).toBe(401);

    const health = await authedApp.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);

    const withToken = await authedApp.inject({
      method: "GET",
      url: "/accounts",
      headers: { authorization: "Bearer demo-token" },
    });
    expect(withToken.statusCode).toBe(200);

    await authedApp.close();
  });
});
