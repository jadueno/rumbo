import { useState, type ComponentType, type SVGProps } from "react";
import { useFinancialData } from "./data/useFinancialData";
import { ResumenScreen } from "./features/resumen/ResumenScreen";
import { GastosScreen } from "./features/gastos/GastosScreen";
import { DeudasScreen } from "./features/deudas/DeudasScreen";
import { AhorroScreen } from "./features/ahorro/AhorroScreen";
import { RecomendacionesScreen } from "./features/recomendaciones/RecomendacionesScreen";
import { SimuladorScreen } from "./features/simulador/SimuladorScreen";
import { HistorialScreen } from "./features/historial/HistorialScreen";
import { ProfileScreen } from "./features/perfil/ProfileScreen";
import {
  HomeIcon,
  ExpenseIcon,
  DebtIcon,
  SavingsIcon,
  TipIcon,
  SimulatorIcon,
  TrendIcon,
  ProfileIcon,
} from "./components/icons";
import { LoadingState } from "./components/LoadingState";
import { BrandMark } from "./components/BrandMark";

type Section =
  | "resumen"
  | "gastos"
  | "deudas"
  | "ahorro"
  | "recomendaciones"
  | "simulador"
  | "historial"
  | "perfil";

const sections: {
  id: Section;
  label: string;
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "resumen", label: "Resumen", shortLabel: "Resumen", icon: HomeIcon },
  { id: "gastos", label: "Ingresos y Gastos", shortLabel: "Gastos", icon: ExpenseIcon },
  { id: "deudas", label: "Deudas", shortLabel: "Deudas", icon: DebtIcon },
  { id: "ahorro", label: "Ahorro", shortLabel: "Ahorro", icon: SavingsIcon },
  { id: "simulador", label: "Simulador", shortLabel: "Simular", icon: SimulatorIcon },
  { id: "historial", label: "Historial", shortLabel: "Historial", icon: TrendIcon },
  { id: "recomendaciones", label: "Recomendaciones", shortLabel: "Consejos", icon: TipIcon },
  { id: "perfil", label: "Perfil", shortLabel: "Perfil", icon: ProfileIcon },
];

export default function App() {
  const [section, setSection] = useState<Section>("resumen");
  const data = useFinancialData();

  return (
    <div className="app-shell flex min-h-screen flex-col sm:flex-row">
      {/* Sidebar de escritorio */}
      <nav
        aria-label="Secciones de la app"
        className="hidden shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface-1)] p-4 sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-60"
      >
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <BrandMark />
          <p className="text-sm leading-tight font-bold text-[var(--text-primary)]">Rumbo</p>
        </div>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-current={section === s.id ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-left text-sm font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-income)] ${
              section === s.id
                ? "bg-[var(--ink)] text-[var(--on-ink)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--gridline)]"
            }`}
          >
            <s.icon className="size-5 shrink-0" />
            {s.label}
          </button>
        ))}
      </nav>

      <main className="relative flex-1 p-4 pb-36 sm:p-8 sm:pb-12">
        <div className="mx-auto max-w-6xl">
          {data.error && (
            <div
              role="alert"
              className="mb-4 rounded-[1.75rem] border p-4 text-sm shadow-card"
              style={{
                borderColor: "var(--status-critical)",
                color: "var(--status-critical)",
                backgroundColor: "color-mix(in srgb, var(--status-critical) 8%, var(--surface-1))",
              }}
            >
              No se ha podido conectar con el backend ({data.error}). ¿Está corriendo{" "}
              <code>npm run dev</code> dentro de <code>backend/</code>?
            </div>
          )}
          {!data.profile && !data.error && <LoadingState />}
          {data.profile && (
            <>
              {section === "resumen" && (
                <ResumenScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  trackers={data.trackers}
                  properties={data.properties}
                />
              )}
              {section === "gastos" && (
                <GastosScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  properties={data.properties}
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
                  properties={data.properties}
                  onAddTracker={data.addTracker}
                  onUpdateTracker={data.updateTracker}
                  onRemoveTracker={data.removeTracker}
                  onAddProperty={data.addProperty}
                  onUpdateProperty={data.updateProperty}
                  onRemoveProperty={data.removeProperty}
                />
              )}
              {section === "simulador" && (
                <SimuladorScreen profile={data.profile} accounts={data.accounts} trackers={data.trackers} />
              )}
              {section === "historial" && (
                <HistorialScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  trackers={data.trackers}
                  properties={data.properties}
                  snapshots={data.snapshots}
                  onAddSnapshot={data.addSnapshot}
                  onUpdateSnapshot={data.updateSnapshot}
                  onRemoveSnapshot={data.removeSnapshot}
                />
              )}
              {section === "recomendaciones" && (
                <RecomendacionesScreen
                  profile={data.profile}
                  accounts={data.accounts}
                  trackers={data.trackers}
                  properties={data.properties}
                />
              )}
              {section === "perfil" && data.rawProfile && (
                <ProfileScreen profile={data.rawProfile} onUpdateProfile={data.updateProfile} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Barra de navegación inferior en móvil */}
      <nav
        aria-label="Secciones de la app"
        className="fixed inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div className="mx-2 mb-3 flex justify-around rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)]/90 px-0.5 py-1.5 shadow-float backdrop-blur-md">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              aria-current={section === s.id ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-0.5 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-income)] ${
                section === s.id ? "bg-[var(--ink)] text-[var(--on-ink)]" : "text-[var(--text-muted)]"
              }`}
            >
              <s.icon className="size-5 shrink-0" />
              <span className="leading-tight">{s.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
