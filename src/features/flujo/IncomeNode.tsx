import { Handle, Position } from "@xyflow/react";
import { formatEUR } from "../../domain/calculations";

export interface IncomeNodeData {
  label: string;
  amount: number;
  [key: string]: unknown;
}

export function IncomeNode({ data }: { data: IncomeNodeData }) {
  return (
    <div
      className="flex w-[168px] flex-col gap-0.5 rounded-2xl px-3.5 py-2.5"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--series-income)",
      }}
    >
      <Handle type="source" position={Position.Right} id="out" style={{ background: "transparent", border: "none", width: 1, height: 1 }} />
      <span className="truncate text-[0.75rem] font-semibold text-[var(--text-primary)]">{data.label}</span>
      <span className="text-[0.7rem] font-semibold tabular-nums" style={{ color: "var(--series-income)" }}>
        +{formatEUR(data.amount)}
      </span>
    </div>
  );
}
