import type { Pool } from "pg";
import type { NewSnapshot, Snapshot } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface SnapshotRow {
  id: string;
  month: string;
  net_worth: string;
  savings_rate: string;
  health_score: number;
}

function toSnapshot(row: SnapshotRow): Snapshot {
  return {
    id: row.id,
    month: row.month,
    netWorth: Number(row.net_worth),
    savingsRate: Number(row.savings_rate),
    healthScore: row.health_score,
  };
}

export function createSnapshotRepository(pool: Pool): Repository<Snapshot, NewSnapshot> {
  return {
    async list() {
      const { rows } = await pool.query<SnapshotRow>(
        "select id, month, net_worth, savings_rate, health_score from snapshots order by month",
      );
      return rows.map(toSnapshot);
    },

    async create(entity) {
      const { rows } = await pool.query<SnapshotRow>(
        `insert into snapshots (month, net_worth, savings_rate, health_score)
         values ($1, $2, $3, $4)
         returning id, month, net_worth, savings_rate, health_score`,
        [entity.month, entity.netWorth, entity.savingsRate, entity.healthScore],
      );
      return toSnapshot(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<SnapshotRow>(
        `update snapshots
         set month = $1, net_worth = $2, savings_rate = $3, health_score = $4, updated_at = now()
         where id = $5
         returning id, month, net_worth, savings_rate, health_score`,
        [entity.month, entity.netWorth, entity.savingsRate, entity.healthScore, id],
      );
      return rows[0] ? toSnapshot(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from snapshots where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
