import { describe, expect, it } from "vitest";
import type { Account, NewAccount } from "../domain/types.js";
import type { AccountRepository } from "../infrastructure/db/repositories/accountRepository.js";
import { callAsync } from "../test/callAsync.js";
import { createAccountUseCases } from "./accounts.js";

function createFakeAccountRepository(): AccountRepository {
  const rows: Account[] = [];
  let nextId = 1;
  return {
    async list() {
      return [...rows];
    },
    async create(entity: NewAccount) {
      const created = { id: String(nextId++), name: entity.name };
      rows.push(created);
      return created;
    },
    async remove(id: string) {
      const index = rows.findIndex((r) => r.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

describe("createAccountUseCases", () => {
  it("crea una cuenta recortando espacios del nombre", async () => {
    const useCases = createAccountUseCases(createFakeAccountRepository());
    const created = await useCases.create({ name: "  ING  " });
    expect(created.name).toBe("ING");
  });

  it("rechaza un nombre vacío", async () => {
    const useCases = createAccountUseCases(createFakeAccountRepository());
    await expect(callAsync(() => useCases.create({ name: "   " }))).rejects.toThrow("no puede estar vacío");
  });

  it("borra una cuenta", async () => {
    const repo = createFakeAccountRepository();
    const useCases = createAccountUseCases(repo);
    const account = await useCases.create({ name: "ING" });
    expect(await useCases.remove(account.id)).toBe(true);
    expect(await repo.list()).toHaveLength(0);
  });

  it("devuelve false al borrar una cuenta inexistente", async () => {
    const useCases = createAccountUseCases(createFakeAccountRepository());
    expect(await useCases.remove("no-existe")).toBe(false);
  });
});
