const STROKE_WIDTH = 10;

function toneForScore(score: number): { color: string; label: string } {
  if (score >= 70) return { color: "var(--status-good)", label: "Buena" };
  if (score >= 40) return { color: "var(--status-warning)", label: "Mejorable" };
  return { color: "var(--status-critical)", label: "Atención" };
}

/** Anillo de progreso circular 0-100 con el número en el centro, coloreado por tramo (bueno/mejorable/atención). */
export function ScoreGauge({ score, size = 128 }: { score: number; size?: number }) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference * (1 - clamped / 100);
  const { color, label } = toneForScore(clamped);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score de salud financiera: ${clamped} de 100, ${label.toLowerCase()}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--gridline)" strokeWidth={STROKE_WIDTH} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums text-[var(--text-primary)]">{clamped}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
