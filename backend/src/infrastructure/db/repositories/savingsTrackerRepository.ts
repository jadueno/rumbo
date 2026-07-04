import type { Pool } from "pg";
import type { NewSavingsTracker, SavingsTracker, TrackerKind } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface TrackerRow {
  id: string;
  kind: TrackerKind;
  name: string;
  account: string;
  initial_balance: string;
  initial_balance_as_of: string;
}

function toTracker(row: TrackerRow): SavingsTracker {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    account: row.account,
    initialBalance: Number(row.initial_balance),
    initialBalanceAsOf: row.initial_balance_as_of,
  };
}

export function createSavingsTrackerRepository(pool: Pool): Repository<SavingsTracker, NewSavingsTracker> {
  return {
    async list() {
      const { rows } = await pool.query<TrackerRow>(
        "select id, kind, name, account, initial_balance, initial_balance_as_of from savings_trackers order by created_at",
      );
      return rows.map(toTracker);
    },

    async create(entity) {
      const { rows } = await pool.query<TrackerRow>(
        `insert into savings_trackers (kind, name, account, initial_balance, initial_balance_as_of)
         values ($1, $2, $3, $4, $5)
         returning id, kind, name, account, initial_balance, initial_balance_as_of`,
        [entity.kind, entity.name, entity.account, entity.initialBalance, entity.initialBalanceAsOf],
      );
      return toTracker(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<TrackerRow>(
        `update savings_trackers
         set kind = $1, name = $2, account = $3, initial_balance = $4, initial_balance_as_of = $5, updated_at = now()
         where id = $6
         returning id, kind, name, account, initial_balance, initial_balance_as_of`,
        [entity.kind, entity.name, entity.account, entity.initialBalance, entity.initialBalanceAsOf, id],
      );
      return rows[0] ? toTracker(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from savings_trackers where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
