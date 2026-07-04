import { useState, type ComponentType, type SVGProps } from "react";
import { useFinancialData } from "./data/useFinancialData";
import { ResumenScreen } from "./features/resumen/ResumenScreen";
import { GastosScreen } from "./features/gastos/GastosScreen";
import { DeudasScreen } from "./features/deudas/DeudasScreen";
import { AhorroScreen } from "./features/ahorro/AhorroScreen";
import { RecomendacionesScreen } from "./features/recomendaciones/RecomendacionesScreen";
import { HomeIcon, ExpenseIcon, DebtIcon, SavingsIcon, TipIcon } from "./components/icons";

type Section = "resumen" | "gastos" | "deudas" | "ahorro" | "recomendaciones";

const sections: {
  id: Section;
  label: string;
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "resumen", label: "Resumen", shortLabel: "Resumen", icon: HomeIcon },
  { id: "gastos", label: "Ingresos y Gastos", shortLabel: "Ingresos/Gastos", icon: ExpenseIcon },
  { id: "deudas", label: "Deudas", shortLabel: "Deudas", icon: DebtIcon },
  { id: "ahorro", label: "Ahorro", shortLabel: "Ahorro", icon: SavingsIcon },
  { id: "recomendaciones", label: "Recomendaciones", shortLabel: "Consejos", icon: TipIcon },
];

export default function App() {
  const [section, setSection] = useState<Section>("resumen");
  const data = useFinancialData();

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      {/* Sidebar de escritorio */}
      <nav
        aria-label="Secciones de la app"
        className="hidden shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface-1)] p-4 sm:flex sm:h-screen sm:w-56"
      >
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Salud financiera
        </p>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-current={section === s.id ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-income)] ${
              section === s.id
                ? "bg-[var(--series-income)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--gridline)]"
            }`}
          >
            <s.icon className="size-5 shrink-0" />
            {s.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 pb-24 sm:p-8 sm:pb-8">
        <div className="mx-auto max-w-3xl">
          {data.error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
            >
              No se ha podido conectar con el backend ({data.error}). ¿Está corriendo{" "}
              <code>npm run dev</code> dentro de <code>backend/</code>?
            </div>
          )}
          {!data.profile && !data.error && (
            <p className="text-sm text-[var(--text-muted)]">Cargando datos…</p>
          )}
          {data.profile && (
            <>
              {section === "resumen" && (
                <ResumenScreen profile={data.profile} accounts={data.accounts} trackers={data.trackers} />
              )}
              {section === "gastos" && (
                <GastosScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  onAddAccount={data.addAccount}
                  onRemoveAccount={data.removeAccount}
                  onAddIncome={data.addIncome}
                  onUpdateIncome={data.updateIncome}
                  onRemoveIncome={data.removeIncome}
                  onAddExpense={data.addExpense}
                  onRemoveExpense={data.removeExpense}
                  onAddTransfer={data.addTransfer}
                  onRemoveTransfer={data.removeTransfer}
                />
              )}
              {section === "deudas" && (
                <DeudasScreen profile={data.profile} onAddDebt={data.addDebt} onRemoveDebt={data.removeDebt} />
              )}
              {section === "ahorro" && (
                <AhorroScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  trackers={data.trackers}
                  onAddTracker={data.addTracker}
                  onRemoveTracker={data.removeTracker}
                />
              )}
              {section === "recomendaciones" && (
                <RecomendacionesScreen profile={data.profile} accounts={data.accounts} trackers={data.trackers} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Barra de navegación inferior en móvil */}
      <nav
        aria-label="Secciones de la app"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--border)] bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-current={section === s.id ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-income)]"
            style={{
              color: section === s.id ? "var(--series-income)" : "var(--text-muted)",
            }}
          >
            <s.icon className="size-6 shrink-0" />
            <span className="leading-tight">{s.shortLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
