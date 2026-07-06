import { useId, useState } from "react";

export interface TrendChartPoint {
  /** "YYYY-MM" */
  month: string;
  value: number;
}

const WIDTH = 600;
const HEIGHT = 160;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

/**
 * Línea de tendencia de una sola serie: 2px, marcadores ≥8px con anillo en el
 * color de superficie, cuadrícula recessive, etiqueta directa solo en el último
 * punto, y una capa de hover con crosshair + tooltip (ver skill de dataviz).
 * Una sola serie no lleva leyenda: el título de la tarjeta ya dice qué se traza.
 */
export function TrendChart({
  points,
  color,
  formatValue,
  label,
}: {
  points: TrendChartPoint[];
  color: string;
  formatValue: (value: number) => string;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gradientId = useId();

  if (points.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Todavía no hay snapshots guardados.</p>;
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = rawMin === rawMax ? rawMin - 1 : rawMin;
  const max = rawMin === rawMax ? rawMax + 1 : rawMax;

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => (points.length === 1 ? WIDTH / 2 : PAD_X + (i / (points.length - 1)) * plotWidth);
  const y = (value: number) => PAD_TOP + (1 - (value - min) / (max - min)) * plotHeight;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(points.length - 1)} ${PAD_TOP + plotHeight} L ${x(0)} ${PAD_TOP + plotHeight} Z`;

  const gridLines = [min, (min + max) / 2, max];
  const last = points[points.length - 1];
  const hoveredPoint = hovered !== null ? points[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        role="img"
        aria-label={`${label}: evolución de ${formatValue(points[0].value)} a ${formatValue(last.value)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.12} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridLines.map((value) => (
          <line
            key={value}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hoveredPoint && (
          <line
            x1={x(hovered!)}
            x2={x(hovered!)}
            y1={PAD_TOP}
            y2={PAD_TOP + plotHeight}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {points.map((p, i) => (
          <g key={p.month}>
            <circle cx={x(i)} cy={y(p.value)} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
            {/* Hit target ≥24px, más ancho que el marcador pintado. */}
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="button"
              aria-label={`${formatMonth(p.month)}: ${formatValue(p.value)}`}
            />
          </g>
        ))}

        {/* Etiqueta directa solo en el último punto (selectiva, no un número por punto). */}
        <text
          x={Math.min(x(points.length - 1), WIDTH - 60)}
          y={y(last.value) - 10}
          textAnchor="end"
          className="text-[11px] font-semibold"
          fill="var(--text-primary)"
        >
          {formatValue(last.value)}
        </text>
      </svg>

      {hoveredPoint && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs shadow-float"
          style={{ left: `${(x(hovered!) / WIDTH) * 100}%` }}
        >
          <p className="text-[var(--text-muted)]">{formatMonth(hoveredPoint.month)}</p>
          <p className="font-semibold text-[var(--text-primary)]">{formatValue(hoveredPoint.value)}</p>
        </div>
      )}
    </div>
  );
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}
