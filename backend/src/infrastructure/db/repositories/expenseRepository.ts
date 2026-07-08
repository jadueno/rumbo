import type { Pool } from "pg";
import type { Expense, ExpenseCategory, NewExpense } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  account: string;
  property: string | null;
  property_id: string | null;
  label: string;
  monthly_amount: string;
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    account: row.account,
    property: row.property,
    propertyId: row.property_id,
    label: row.label,
    monthlyAmount: Number(row.monthly_amount),
  };
}

export function createExpenseRepository(pool: Pool): Repository<Expense, NewExpense> {
  return {
    async list() {
      const { rows } = await pool.query<ExpenseRow>(
        "select id, category, account, property, property_id, label, monthly_amount from expenses order by created_at",
      );
      return rows.map(toExpense);
    },

    async create(entity) {
      const { rows } = await pool.query<ExpenseRow>(
        `insert into expenses (category, account, property, property_id, label, monthly_amount)
         values ($1, $2, $3, $4, $5, $6)
         returning id, category, account, property, property_id, label, monthly_amount`,
        [entity.category, entity.account, entity.property, entity.propertyId, entity.label, entity.monthlyAmount],
      );
      return toExpense(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<ExpenseRow>(
        `update expenses
         set category = $1, account = $2, property = $3, property_id = $4, label = $5, monthly_amount = $6, updated_at = now()
         where id = $7
         returning id, category, account, property, property_id, label, monthly_amount`,
        [entity.category, entity.account, entity.property, entity.propertyId, entity.label, entity.monthlyAmount, id],
      );
      return rows[0] ? toExpense(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from expenses where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
