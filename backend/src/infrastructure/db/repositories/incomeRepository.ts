import type { Pool } from "pg";
import type { Income, NewIncome } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface IncomeRow {
  id: string;
  account: string;
  label: string;
  monthly_amount: string;
  property: string | null;
  property_id: string | null;
}

function toIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    account: row.account,
    label: row.label,
    monthlyAmount: Number(row.monthly_amount),
    property: row.property,
    propertyId: row.property_id,
  };
}

export function createIncomeRepository(pool: Pool): Repository<Income, NewIncome> {
  return {
    async list() {
      const { rows } = await pool.query<IncomeRow>(
        "select id, account, label, monthly_amount, property, property_id from incomes order by created_at",
      );
      return rows.map(toIncome);
    },

    async create(entity) {
      const { rows } = await pool.query<IncomeRow>(
        `insert into incomes (account, label, monthly_amount, property, property_id)
         values ($1, $2, $3, $4, $5)
         returning id, account, label, monthly_amount, property, property_id`,
        [entity.account, entity.label, entity.monthlyAmount, entity.property, entity.propertyId],
      );
      return toIncome(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<IncomeRow>(
        `update incomes
         set account = $1, label = $2, monthly_amount = $3, property = $4, property_id = $5, updated_at = now()
         where id = $6
         returning id, account, label, monthly_amount, property, property_id`,
        [entity.account, entity.label, entity.monthlyAmount, entity.property, entity.propertyId, id],
      );
      return rows[0] ? toIncome(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from incomes where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
