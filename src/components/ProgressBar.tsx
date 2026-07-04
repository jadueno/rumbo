export function ProgressBar({
  progress,
  color = "var(--series-savings)",
}: {
  progress: number; // 0..1
  color?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div
      className="h-3 w-full rounded-full bg-[var(--gridline)]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-3 rounded-full transition-[width]"
        style={{ width: `${Math.max(2, pct)}%`, backgroundColor: color }}
      />
    </div>
  );
}
