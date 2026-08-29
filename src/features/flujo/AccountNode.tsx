import { Handle, Position } from "@xyflow/react";
import { formatEUR } from "../../domain/calculations";

export interface AccountNodeData {
  name: string;
  balance: number;
  income: number;
  transfersIn: number;
  transfersOut: number;
  [key: string]: unknown;
}

const RING_COLORS = [
  "var(--series-violet)",
  "var(--accent-yellow)",
  "var(--series-savings)",
  "var(--series-income)",
  "var(--series-expense)",
  // Mezclas de los mismos tokens para más entidades sin salirse de la paleta.
  "color-mix(in srgb, var(--series-violet) 55%, var(--series-income) 45%)",
  "color-mix(in srgb, var(--accent-yellow) 55%, var(--series-expense) 45%)",
  "color-mix(in srgb, var(--series-savings) 55%, var(--series-violet) 45%)",
];

/** "Bankinter - Nómina" -> "Bankinter", "MyInvestor (Pensión)" -> "MyInvestor", "BBVA" -> "BBVA". */
function accountEntity(name: string): string {
  return name.split(/ - | \(/)[0].trim();
}

/** Un color por entidad bancaria (no por cuenta): las cuentas de un mismo banco comparten
 * anillo, así se ve de un vistazo qué bolas son del mismo sitio. */
export function buildAccountColors(accountNames: string[]): Map<string, string> {
  const colorByEntity = new Map<string, string>();
  const result = new Map<string, string>();
  for (const name of accountNames) {
    const entity = accountEntity(name);
    if (!colorByEntity.has(entity)) {
      colorByEntity.set(entity, RING_COLORS[colorByEntity.size % RING_COLORS.length]);
    }
    result.set(name, colorByEntity.get(entity)!);
  }
  return result;
}

export function AccountNode({ data, selected }: { data: AccountNodeData; selected?: boolean }) {
  const negative = data.balance < 0;
  return (
    <div
      className="flex h-[132px] w-[132px] flex-col items-center justify-center gap-1 rounded-full text-center transition-transform duration-150"
      style={{
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--surface-2) 55%, white 8%), var(--surface-2) 70%)`,
        border: `2px solid ${negative ? "var(--status-critical)" : (data.ringColor as string)}`,
        boxShadow: selected
          ? `0 0 0 4px color-mix(in srgb, ${data.ringColor as string} 35%, transparent), 0 8px 20px -6px rgba(0,0,0,0.5)`
          : "0 4px 14px -6px rgba(0,0,0,0.45)",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      {/* Un único punto de entrada y uno de salida por cuenta (no uno por arista): todas
          las salidas parten del mismo sitio y se abren en abanico hacia su destino, y las
          entradas llegan todas por el lado contrario — así se lee de un vistazo qué es
          entrada y qué es salida en vez de tener flechas saliendo de cualquier borde. */}
      <Handle type="target" position={Position.Left} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="out" style={handleStyle} />
      <span className="px-3 text-[0.8rem] leading-tight font-bold text-[var(--text-primary)]">{data.name}</span>
      <span
        className="text-[0.95rem] leading-none font-extrabold tabular-nums"
        style={{ color: negative ? "var(--status-critical)" : "var(--text-secondary)" }}
      >
        {formatEUR(data.balance)}
      </span>
    </div>
  );
}

const handleStyle = { background: "transparent", border: "none", width: 1, height: 1 };
