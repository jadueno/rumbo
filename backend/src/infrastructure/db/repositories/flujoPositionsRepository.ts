import type { Pool } from "pg";
import type { FlujoPositions } from "../../../domain/types.js";

export interface FlujoPositionsRepository {
  /** `{}` si todavía no se ha guardado ninguna posición. */
  get(): Promise<FlujoPositions>;
  update(positions: FlujoPositions): Promise<FlujoPositions>;
}

export function createFlujoPositionsRepository(pool: Pool): FlujoPositionsRepository {
  return {
    async get() {
      const { rows } = await pool.query<{ positions: FlujoPositions }>(
        "select positions from flujo_positions where id = true",
      );
      return rows[0]?.positions ?? {};
    },

    async update(positions) {
      const { rows } = await pool.query<{ positions: FlujoPositions }>(
        `insert into flujo_positions (id, positions) values (true, $1)
         on conflict (id) do update set positions = $1, updated_at = now()
         returning positions`,
        [JSON.stringify(positions)],
      );
      return rows[0].positions;
    },
  };
}
