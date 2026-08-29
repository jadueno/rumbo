import { useMemo, useState } from "react";
import { Background, BackgroundVariant, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./flujo.css";
import type { Account, FinancialProfile } from "../../domain/types";
import { balanceByAccount, formatEUR } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { AccountNode, accountRingColor, type AccountNodeData } from "./AccountNode";
import { IncomeNode, type IncomeNodeData } from "./IncomeNode";
import { settleLayout, type LayoutEdge, type LayoutNode } from "./layout";

const nodeTypes = { account: AccountNode, income: IncomeNode };

export function FlujoScreen({ profile, accounts }: { profile: FinancialProfile; accounts: Account[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const totalIncome = profile.incomes.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const totalTransfers = profile.transfers.reduce((sum, t) => sum + t.monthlyAmount, 0);

  const { nodes, edges } = useMemo(() => {
    const layoutNodes: LayoutNode[] = [];
    const layoutEdges: LayoutEdge[] = [];

    // Posiciones iniciales: cuentas repartidas en círculo (punto de partida ya disperso
    // para que el layout de fuerzas converja rápido), ingresos pegados a su cuenta.
    accounts.forEach((account, i) => {
      const angle = (i / Math.max(accounts.length, 1)) * Math.PI * 2;
      const radius = 260;
      layoutNodes.push({
        id: `account-${account.name}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        kind: "account",
      });
    });

    profile.incomes.forEach((income, j) => {
      const account = layoutNodes.find((n) => n.id === `account-${income.account}`);
      layoutNodes.push({
        id: `income-${income.id}`,
        x: (account?.x ?? 0) - 220,
        y: (account?.y ?? 0) + (j % 3) * 40 - 40,
        vx: 0,
        vy: 0,
        kind: "income",
        accountId: `account-${income.account}`,
      });
      layoutEdges.push({
        source: `income-${income.id}`,
        target: `account-${income.account}`,
        rest: 190,
        strength: 0.025,
      });
    });

    profile.transfers.forEach((t) => {
      layoutEdges.push({
        source: `account-${t.fromAccount}`,
        target: `account-${t.toAccount}`,
        rest: 300,
        strength: 0.015,
      });
    });

    const settled = settleLayout(layoutNodes, layoutEdges);

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    accounts.forEach((account, i) => {
      const pos = settled.get(`account-${account.name}`)!;
      const balance = accountBalances.find((b) => b.account === account.name);
      nodes.push({
        id: `account-${account.name}`,
        type: "account",
        position: { x: pos.x, y: pos.y },
        data: {
          name: account.name,
          balance: balance?.balance ?? 0,
          income: balance?.income ?? 0,
          transfersIn: balance?.transfersIn ?? 0,
          transfersOut: balance?.transfersOut ?? 0,
          selected: selected === account.name,
          ringColor: accountRingColor(i),
        } satisfies AccountNodeData & { ringColor: string },
        draggable: true,
      });
    });

    profile.incomes.forEach((income) => {
      const pos = settled.get(`income-${income.id}`)!;
      nodes.push({
        id: `income-${income.id}`,
        type: "income",
        position: { x: pos.x, y: pos.y },
        data: { label: income.label, amount: income.monthlyAmount } satisfies IncomeNodeData,
        draggable: true,
      });
      edges.push({
        id: `e-income-${income.id}`,
        source: `income-${income.id}`,
        sourceHandle: "out",
        target: `account-${income.account}`,
        targetHandle: "in",
        label: formatEUR(income.monthlyAmount),
        style: { stroke: "var(--series-income)" },
        labelStyle: { fill: "var(--series-income)", fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: "var(--surface-1)" },
        labelBgPadding: [4, 2],
      });
    });

    profile.transfers.forEach((t) => {
      const from = settled.get(`account-${t.fromAccount}`)!;
      const to = settled.get(`account-${t.toAccount}`)!;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const sourceHandle = horizontal ? (dx >= 0 ? "out" : "out-left") : dy >= 0 ? "out-bottom" : "out-top";
      const targetHandle = horizontal ? (dx >= 0 ? "in" : "in-right") : dy >= 0 ? "in-top" : "in-bottom";
      edges.push({
        id: `e-transfer-${t.id}`,
        source: `account-${t.fromAccount}`,
        sourceHandle,
        target: `account-${t.toAccount}`,
        targetHandle,
        label: formatEUR(t.monthlyAmount),
        style: { stroke: "var(--series-violet)" },
        labelStyle: { fill: "var(--series-violet)", fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: "var(--surface-1)" },
        labelBgPadding: [4, 2],
      });
    });

    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, accounts, selected]);

  const selectedBalance = selected ? accountBalances.find((b) => b.account === selected) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Flujo de cuentas</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Cómo entra y se mueve el dinero entre tus cuentas cada mes. Arrastra las bolas para reordenar, haz scroll o
          usa los controles para hacer zoom.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Ingresos al mes</p>
          <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--series-income)" }}>
            {formatEUR(totalIncome)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Traspasos al mes</p>
          <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--series-violet)" }}>
            {formatEUR(totalTransfers)}
          </p>
        </Card>
        <Card className="!p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Cuentas</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">{accounts.length}</p>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="rumbo-flow h-[62vh] min-h-[420px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              if (node.type === "account") {
                const name = node.id.replace(/^account-/, "");
                setSelected((s) => (s === name ? null : name));
              }
            }}
            onPaneClick={() => setSelected(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--gridline)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </Card>

      {selectedBalance && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)]">{selectedBalance.account}</h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cerrar
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Ingresos</dt>
              <dd className="text-sm font-semibold tabular-nums" style={{ color: "var(--series-income)" }}>
                {formatEUR(selectedBalance.income)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Traspasos entrantes</dt>
              <dd className="text-sm font-semibold tabular-nums" style={{ color: "var(--series-violet)" }}>
                {formatEUR(selectedBalance.transfersIn)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Traspasos salientes</dt>
              <dd className="text-sm font-semibold tabular-nums" style={{ color: "var(--series-expense)" }}>
                {formatEUR(selectedBalance.transfersOut)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Balance</dt>
              <dd
                className="text-sm font-semibold tabular-nums"
                style={{ color: selectedBalance.balance < 0 ? "var(--status-critical)" : "var(--text-primary)" }}
              >
                {formatEUR(selectedBalance.balance)}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
