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
  create(entity: NewAccount): Promise<Account>;
  /** Renombra la cuenta y, en cascada, actualiza todo lo que la referencie por el nombre
   * anterior (ingresos, gastos, transferencias, seguimientos de ahorro/inversión). */
  update(id: string, entity: NewAccount): Promise<Account | null>;
  /** Borra la cuenta y, en cascada, todo lo que la referencie por nombre (ingresos, gastos,
   * transferencias, seguimientos de ahorro/inversión). */
  remove(id: string): Promise<boolean>;
}

export function createAccountRepository(pool: Pool): AccountRepository {
  return {
    async list() {
      const { rows } = await pool.query<AccountRow>("select id, name from accounts order by created_at");
      return rows.map(toAccount);
    },

    async create(entity) {
      const { rows } = await pool.query<AccountRow>(
        "insert into accounts (name) values ($1) returning id, name",
        [entity.name],
      );
      return toAccount(rows[0]);
    },

    async update(id, entity) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const { rows } = await client.query<AccountRow>("select id, name from accounts where id = $1", [id]);
        const account = rows[0];
        if (!account) {
          await client.query("rollback");
          return null;
        }
        const { rows: updatedRows } = await client.query<AccountRow>(
          "update accounts set name = $1, updated_at = now() where id = $2 returning id, name",
          [entity.name, id],
        );
        if (account.name !== entity.name) {
          await client.query("update incomes set account = $1 where account = $2", [entity.name, account.name]);
          await client.query("update expenses set account = $1 where account = $2", [entity.name, account.name]);
          await client.query("update transfers set from_account = $1 where from_account = $2", [
            entity.name,
            account.name,
          ]);
          await client.query("update transfers set to_account = $1 where to_account = $2", [
            entity.name,
            account.name,
          ]);
          await client.query("update savings_trackers set account = $1 where account = $2", [
            entity.name,
            account.name,
          ]);
        }
        await client.query("commit");
        return toAccount(updatedRows[0]);
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },

    async remove(id) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const { rows } = await client.query<AccountRow>("select id, name from accounts where id = $1", [id]);
        const account = rows[0];
        if (!account) {
          await client.query("rollback");
          return false;
        }
        await client.query("delete from incomes where account = $1", [account.name]);
        await client.query("delete from expenses where account = $1", [account.name]);
        await client.query("delete from transfers where from_account = $1 or to_account = $1", [account.name]);
        await client.query("delete from savings_trackers where account = $1", [account.name]);
        const { rowCount } = await client.query("delete from accounts where id = $1", [id]);
        await client.query("commit");
        return (rowCount ?? 0) > 0;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
