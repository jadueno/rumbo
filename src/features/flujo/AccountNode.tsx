import { Handle, Position } from "@xyflow/react";
import { formatEUR } from "../../domain/calculations";

export interface AccountNodeData {
  name: string;
  balance: number;
  income: number;
  transfersIn: number;
  transfersOut: number;
  selected: boolean;
  [key: string]: unknown;
}

const RING_COLORS = [
  "var(--series-violet)",
  "var(--accent-yellow)",
  "var(--series-savings)",
  "var(--series-income)",
  "var(--series-expense)",
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

export function AccountNode({ data }: { data: AccountNodeData }) {
  const negative = data.balance < 0;
  return (
    <div
      className="flex h-[132px] w-[132px] flex-col items-center justify-center gap-1 rounded-full text-center transition-transform duration-150"
      style={{
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--surface-2) 55%, white 8%), var(--surface-2) 70%)`,
        border: `2px solid ${negative ? "var(--status-critical)" : (data.ringColor as string)}`,
        boxShadow: data.selected
          ? `0 0 0 4px color-mix(in srgb, ${data.ringColor as string} 35%, transparent), 0 8px 20px -6px rgba(0,0,0,0.5)`
          : "0 4px 14px -6px rgba(0,0,0,0.45)",
        transform: data.selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      {/* Cada lado lleva un handle de entrada y uno de salida: al ser un layout libre en
          2D (no una columna fija), qué lado usa cada arista de traspaso se decide en
          FlujoScreen según la posición relativa real entre las dos cuentas. */}
      <Handle type="target" position={Position.Left} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="out-left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="out" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="in-right" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="in-top" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="out-top" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="in-bottom" style={handleStyle} />
      <span className="px-3 text-[0.8rem] leading-tight font-bold text-[var(--text-primary)]">{data.name}</span>
      <span
        className="text-[0.7rem] font-semibold tabular-nums"
        style={{ color: negative ? "var(--status-critical)" : "var(--text-secondary)" }}
      >
        {formatEUR(data.balance)}
      </span>
    </div>
  );
}

const handleStyle = { background: "transparent", border: "none", width: 1, height: 1 };
