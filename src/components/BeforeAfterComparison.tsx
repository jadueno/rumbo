import { formatEUR } from "../domain/calculations";

export interface BeforeAfterItem {
  label: string;
  before: number;
  after: number;
}

/** Compara un mismo conjunto de métricas antes/después de un cambio hipotético (simulador), con la diferencia destacada. */
export function BeforeAfterComparison({ items }: { items: BeforeAfterItem[] }) {
  const max = Math.max(...items.flatMap((i) => [Math.abs(i.before), Math.abs(i.after)]), 1);

  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => {
        const delta = item.after - item.before;
        return (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
              {delta !== 0 && (
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: delta > 0 ? "var(--status-good)" : "var(--status-critical)" }}
                >
                  {delta > 0 ? "+" : ""}
                  {formatEUR(delta)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-[var(--text-muted)]">Antes</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--gridline)]">
                <div
                  className="h-2.5 rounded-full bg-[var(--text-muted)]"
                  style={{ width: `${Math.max(2, (Math.abs(item.before) / max) * 100)}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-[var(--text-muted)]">
                {formatEUR(item.before)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold text-[var(--text-primary)]">Después</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--gridline)]">
                <div
                  className="h-2.5 rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${Math.max(2, (Math.abs(item.after) / max) * 100)}%`,
                    background: "var(--series-violet)",
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                {formatEUR(item.after)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
