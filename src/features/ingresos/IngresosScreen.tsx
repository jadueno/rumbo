import type { FinancialProfile } from "../../domain/types";
import { formatEUR, totalMonthlyIncome } from "../../domain/calculations";
import { Card } from "../../components/Card";

export function IngresosScreen({ profile }: { profile: FinancialProfile }) {
  const total = totalMonthlyIncome(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ingresos</h1>
        <p className="text-sm text-[var(--text-secondary)]">Todas tus fuentes de ingreso mensual.</p>
      </div>

      <Card>
        {profile.incomes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No hay ingresos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">Listado de ingresos mensuales</caption>
            <thead>
              <tr className="border-b border-[var(--gridline)] text-left text-[var(--text-muted)]">
                <th scope="col" className="py-2 font-medium">Cuenta</th>
                <th scope="col" className="py-2 font-medium">Concepto</th>
                <th scope="col" className="py-2 pr-0 text-right font-medium">Importe / mes</th>
              </tr>
            </thead>
            <tbody>
              {profile.incomes.map((income) => (
                <tr key={`${income.account}-${income.label}`} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="py-2.5 text-[var(--text-secondary)]">{income.account}</td>
                  <td className="py-2.5 text-[var(--text-primary)]">{income.label}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-[var(--text-primary)]">
                    {formatEUR(income.monthlyAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 font-semibold text-[var(--text-primary)]" colSpan={2}>
                  Total
                </td>
                <td className="pt-3 text-right tabular-nums font-semibold text-[var(--text-primary)]">
                  {formatEUR(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </div>
  );
}
