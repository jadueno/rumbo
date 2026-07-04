import type { Pool } from "pg";
import type { NewTransfer, Transfer } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface TransferRow {
  id: string;
  from_account: string;
  to_account: string;
  monthly_amount: string;
}

function toTransfer(row: TransferRow): Transfer {
  return {
    id: row.id,
    fromAccount: row.from_account,
    toAccount: row.to_account,
    monthlyAmount: Number(row.monthly_amount),
  };
}

export function createTransferRepository(pool: Pool): Repository<Transfer, NewTransfer> {
  return {
    async list() {
      const { rows } = await pool.query<TransferRow>(
        `select id, from_account, to_account, monthly_amount
         from transfers order by created_at`,
      );
      return rows.map(toTransfer);
    },

    async create(entity) {
      const { rows } = await pool.query<TransferRow>(
        `insert into transfers (from_account, to_account, monthly_amount)
         values ($1, $2, $3)
         returning id, from_account, to_account, monthly_amount`,
        [entity.fromAccount, entity.toAccount, entity.monthlyAmount],
      );
      return toTransfer(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<TransferRow>(
        `update transfers
         set from_account = $1, to_account = $2, monthly_amount = $3, updated_at = now()
         where id = $4
         returning id, from_account, to_account, monthly_amount`,
        [entity.fromAccount, entity.toAccount, entity.monthlyAmount, id],
      );
      return rows[0] ? toTransfer(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from transfers where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
