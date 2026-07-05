import type { Pool } from "pg";
import type { NewProperty, Property } from "../../../domain/types.js";
import type { Repository } from "../../../domain/ports.js";

interface PropertyRow {
  id: string;
  name: string;
  estimated_value: string;
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    estimatedValue: Number(row.estimated_value),
  };
}

export function createPropertyRepository(pool: Pool): Repository<Property, NewProperty> {
  return {
    async list() {
      const { rows } = await pool.query<PropertyRow>(
        "select id, name, estimated_value from properties order by created_at",
      );
      return rows.map(toProperty);
    },

    async create(entity) {
      const { rows } = await pool.query<PropertyRow>(
        `insert into properties (name, estimated_value)
         values ($1, $2)
         returning id, name, estimated_value`,
        [entity.name, entity.estimatedValue],
      );
      return toProperty(rows[0]);
    },

    async update(id, entity) {
      const { rows } = await pool.query<PropertyRow>(
        `update properties set name = $1, estimated_value = $2, updated_at = now()
         where id = $3
         returning id, name, estimated_value`,
        [entity.name, entity.estimatedValue, id],
      );
      return rows[0] ? toProperty(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("delete from properties where id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
