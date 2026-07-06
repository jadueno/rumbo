import { afterEach, describe, expect, it } from "vitest";
import { createTestPool } from "./testPool.js";

describe("createTestPool", () => {
  const originalTest = process.env.TEST_DATABASE_URL;
  const originalReal = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.TEST_DATABASE_URL = originalTest;
    process.env.DATABASE_URL = originalReal;
  });

  it("falla si falta TEST_DATABASE_URL", () => {
    delete process.env.TEST_DATABASE_URL;
    expect(() => createTestPool()).toThrow("Falta TEST_DATABASE_URL");
  });

  it("falla si TEST_DATABASE_URL apunta a la misma base que DATABASE_URL (nunca truncar datos reales)", () => {
    process.env.DATABASE_URL = "postgres://u:p@localhost:5433/salud_financiera";
    process.env.TEST_DATABASE_URL = "postgres://u:p@localhost:5433/salud_financiera";
    expect(() => createTestPool()).toThrow("truncarían tus datos reales");
  });

  it("crea el pool cuando TEST_DATABASE_URL es distinta de DATABASE_URL", async () => {
    process.env.DATABASE_URL = "postgres://u:p@localhost:5433/salud_financiera";
    process.env.TEST_DATABASE_URL = "postgres://u:p@localhost:5433/salud_financiera_test";
    const pool = createTestPool();
    await pool.end();
  });
});
