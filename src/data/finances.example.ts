import type { AccountFlow, EmergencyFund } from "../domain/types";

/**
 * Plantilla de ejemplo. Copia este archivo a `finances.ts` (ignorado por
 * git) y sustituye los valores por los tuyos.
 */
export const staticProfile: { age: number; accountFlows: AccountFlow[]; emergencyFund: EmergencyFund } = {
  age: 30,
  accountFlows: [
    { account: "Cuenta Ahorro", entra: 200, sale: 0 },
    { account: "Cuenta Nómina", entra: 2000, sale: -1050 },
  ],
  emergencyFund: {
    targetMonths: 3,
  },
};
