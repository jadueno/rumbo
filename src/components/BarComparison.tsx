import { formatEUR } from "../domain/calculations";

export interface BarComparisonItem {
  label: string;
  value: number;
  color: string;
}

export function BarComparison({ items }: { items: BarComparisonItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-3" role="img" aria-label="Comparativa de ingresos, gastos y ahorro mensual">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">
              {formatEUR(item.value)}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[var(--gridline)]">
            <div
              className="h-3 rounded-full transition-[width]"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
