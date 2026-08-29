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
      className="flex w-[176px] flex-col gap-1 rounded-2xl px-4 py-3"
      style={{
        background: `linear-gradient(135deg, var(--series-income), color-mix(in srgb, var(--series-income) 75%, var(--series-savings)))`,
        boxShadow: "0 6px 18px -6px color-mix(in srgb, var(--series-income) 60%, transparent)",
      }}
    >
      <Handle type="source" position={Position.Right} id="out" style={{ background: "transparent", border: "none", width: 1, height: 1 }} />
      <span
        className="truncate text-[0.75rem] font-semibold"
        style={{ color: "var(--on-series-income)" }}
      >
        {data.label}
      </span>
      <span className="text-base leading-none font-extrabold tabular-nums" style={{ color: "var(--on-series-income)" }}>
        +{formatEUR(data.amount)}
      </span>
    </div>
  );
}
