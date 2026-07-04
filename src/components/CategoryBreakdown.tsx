import { formatEUR } from "../domain/calculations";

const categoricalSlots = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

export function CategoryBreakdown({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  if (entries.length === 0) {
    return (
      <section aria-labelledby={`${title}-heading`}>
        <h3 id={`${title}-heading`} className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-muted)]">No hay datos todavía.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${title}-heading`} className="flex flex-col gap-3">
      <h3 id={`${title}-heading`} className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {entries.map(([label, value], i) => (
          <li key={label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="tabular-nums font-medium text-[var(--text-primary)]">
                {formatEUR(value)} · {total > 0 ? Math.round((value / total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--gridline)]">
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${total > 0 ? Math.max(2, (value / total) * 100) : 0}%`,
                  backgroundColor: categoricalSlots[i % categoricalSlots.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
