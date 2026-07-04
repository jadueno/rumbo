import type { Pool } from "pg";
import type { Account, NewAccount } from "../../../domain/types.js";

interface AccountRow {
  id: string;
  name: string;
}

function toAccount(row: AccountRow): Account {
  return { id: row.id, name: row.name };
}

export interface AccountRepository {
  list(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  create(entity: NewAccount): Promise<Account>;
  remove(id: string): Promise<boolean>;
  /** Cuántos ingresos/gastos/transferencias referencian esta cuenta por nombre. */
  countUsages(name: string): Promise<number>;
}

export function createAccountRepository(pool: Pool): AccountRepository {
  return {
    async list() {
      const { rows } = await pool.query<AccountRow>("select id, name from accounts order by created_at");
      return rows.map(toAccount);
    },

    async findById(id) {
      const { rows } = await pool.query<AccountRow>("select id, name from accounts where id = $1", [id]);
      return rows[0] ? toAccount(rows[0]) : null;
    },

    async create(entity) {
      const { rows } = await pool.query<AccountRow>(
        "insert into accounts (name) values ($1) returning id, name",
        [entity.name],
      );
      return toAccount(rows[0]);
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from accounts where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },

    async countUsages(name) {
      const { rows } = await pool.query<{ count: string }>(
        `select
           (select count(*) from incomes where account = $1)
           + (select count(*) from expenses where account = $1)
           + (select count(*) from transfers where from_account = $1 or to_account = $1)
           as count`,
        [name],
      );
      return Number(rows[0].count);
    },
  };
}
