import type { Pool } from "pg";
import type { Profile } from "../../../domain/types.js";

interface ProfileRow {
  name: string;
  birth_date: string;
  emergency_fund_target_months: number;
}

function toProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    birthDate: row.birth_date,
    emergencyFundTargetMonths: row.emergency_fund_target_months,
  };
}

export interface ProfileRepository {
  /** Siempre hay exactamente una fila (creada por la migración de seed inicial). */
  get(): Promise<Profile>;
  update(entity: Profile): Promise<Profile>;
}

export function createProfileRepository(pool: Pool): ProfileRepository {
  return {
    async get() {
      const { rows } = await pool.query<ProfileRow>(
        "select name, birth_date, emergency_fund_target_months from profile limit 1",
      );
      if (!rows[0]) {
        throw new Error("No hay fila de perfil: falta aplicar la migración de seed inicial.");
      }
      return toProfile(rows[0]);
    },

    async update(entity) {
      const { rows } = await pool.query<ProfileRow>(
        `update profile set name = $1, birth_date = $2, emergency_fund_target_months = $3, updated_at = now()
         returning name, birth_date, emergency_fund_target_months`,
        [entity.name, entity.birthDate, entity.emergencyFundTargetMonths],
      );
      return toProfile(rows[0]);
    },
  };
}
