import { useState } from "react";
import { financialProfile } from "./data/finances";
import { ResumenScreen } from "./features/resumen/ResumenScreen";
import { IngresosScreen } from "./features/ingresos/IngresosScreen";
import { GastosScreen } from "./features/gastos/GastosScreen";
import { DeudasScreen } from "./features/deudas/DeudasScreen";
import { AhorroScreen } from "./features/ahorro/AhorroScreen";
import { RecomendacionesScreen } from "./features/recomendaciones/RecomendacionesScreen";

type Section = "resumen" | "ingresos" | "gastos" | "deudas" | "ahorro" | "recomendaciones";

const sections: { id: Section; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "ingresos", label: "Ingresos" },
  { id: "gastos", label: "Gastos" },
  { id: "deudas", label: "Deudas" },
  { id: "ahorro", label: "Ahorro" },
  { id: "recomendaciones", label: "Recomendaciones" },
];

export default function App() {
  const [section, setSection] = useState<Section>("resumen");

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <nav
        aria-label="Secciones de la app"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-1)] p-3 sm:h-screen sm:w-56 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-4"
      >
        <p className="hidden px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:block">
          Salud financiera
        </p>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-current={section === s.id ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-income)] ${
              section === s.id
                ? "bg-[var(--series-income)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--gridline)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          {section === "resumen" && <ResumenScreen profile={financialProfile} />}
          {section === "ingresos" && <IngresosScreen profile={financialProfile} />}
          {section === "gastos" && <GastosScreen profile={financialProfile} />}
          {section === "deudas" && <DeudasScreen profile={financialProfile} />}
          {section === "ahorro" && <AhorroScreen profile={financialProfile} />}
          {section === "recomendaciones" && <RecomendacionesScreen profile={financialProfile} />}
        </div>
      </main>
    </div>
  );
}
