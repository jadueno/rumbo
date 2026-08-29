import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./flujo.css";
import type { Account, FinancialProfile, FlujoPositions } from "../../domain/types";
import { balanceByAccount, formatEUR } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { AccountNode, buildAccountColors, type AccountNodeData } from "./AccountNode";
import { IncomeNode, type IncomeNodeData } from "./IncomeNode";
import { settleLayout, type LayoutEdge, type LayoutNode } from "./layout";

const nodeTypes = { account: AccountNode, income: IncomeNode };

// Un ingreso no puede quedar a la derecha de su cuenta: como cada cuenta tiene un único
// punto de entrada (izquierda) y de salida (derecha) fijos, si el ingreso cruza al otro
// lado la flecha tiene que rodear la bola entera y se enrosca sobre sí misma.
const INCOME_CLAMP_MARGIN = 190;

export function FlujoScreen({
  profile,
  accounts,
  flujoPositions,
  onUpdateFlujoPositions,
}: {
  profile: FinancialProfile;
  accounts: Account[];
  flujoPositions: FlujoPositions;
  onUpdateFlujoPositions: (positions: FlujoPositions) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const accountBalances = balanceByAccount(profile, accounts.map((a) => a.name));
  const totalIncome = profile.incomes.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const totalTransfers = profile.transfers.reduce((sum, t) => sum + t.monthlyAmount, 0);

  // Recalcular el layout de fuerzas es caro (260 iteraciones) y bloquea el hilo principal
  // mientras corre. Si dependiera de `profile`/`accounts` por referencia, cada refresco en
  // segundo plano (p. ej. al recuperar el foco de la pestaña) dispararía el recálculo
  // aunque los datos no hayan cambiado — justo lo que hacía que el zoom/paneo se quedaran
  // pillados a media interacción. Esta clave solo cambia si algo relevante cambia de verdad.
  const layoutKey = JSON.stringify({
    accounts: accounts.map((a) => a.name),
    incomes: profile.incomes.map((i) => [i.id, i.account, i.label, i.monthlyAmount]),
    expenses: profile.expenses.map((e) => [e.id, e.account, e.monthlyAmount]),
    transfers: profile.transfers.map((t) => [t.id, t.fromAccount, t.toAccount, t.monthlyAmount]),
  });

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    const layoutNodes: LayoutNode[] = [];
    const layoutEdges: LayoutEdge[] = [];

    // Posiciones iniciales: cuentas repartidas en círculo (punto de partida ya disperso
    // para que el layout de fuerzas converja rápido), ingresos pegados a su cuenta.
    accounts.forEach((account, i) => {
      const angle = (i / Math.max(accounts.length, 1)) * Math.PI * 2;
      const radius = 380;
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
        rest: 240,
        strength: 0.025,
      });
    });

    profile.transfers.forEach((t) => {
      layoutEdges.push({
        source: `account-${t.fromAccount}`,
        target: `account-${t.toAccount}`,
        rest: 420,
        strength: 0.015,
      });
    });

    const settled = settleLayout(layoutNodes, layoutEdges);
    const saved = flujoPositions;

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const colorByAccount = buildAccountColors(accounts.map((a) => a.name));

    accounts.forEach((account) => {
      const id = `account-${account.name}`;
      const pos = saved[id] ?? settled.get(id)!;
      const balance = accountBalances.find((b) => b.account === account.name);
      nodes.push({
        id,
        type: "account",
        position: { x: pos.x, y: pos.y },
        data: {
          name: account.name,
          balance: balance?.balance ?? 0,
          income: balance?.income ?? 0,
          transfersIn: balance?.transfersIn ?? 0,
          transfersOut: balance?.transfersOut ?? 0,
          ringColor: colorByAccount.get(account.name)!,
        } satisfies AccountNodeData & { ringColor: string },
        draggable: true,
      });
    });

    profile.incomes.forEach((income) => {
      const id = `income-${income.id}`;
      const pos = saved[id] ?? settled.get(id)!;
      nodes.push({
        id,
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
        style: { stroke: "var(--series-income)", strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--series-income)", width: 22, height: 22 },
      });
    });

    profile.transfers.forEach((t) => {
      edges.push({
        id: `e-transfer-${t.id}`,
        source: `account-${t.fromAccount}`,
        sourceHandle: "out",
        target: `account-${t.toAccount}`,
        targetHandle: "in",
        label: formatEUR(t.monthlyAmount),
        style: { stroke: "var(--series-violet)", strokeWidth: 2.5 },
        labelStyle: { fill: "var(--series-violet)", fontWeight: 800, fontSize: 15 },
        labelBgStyle: { fill: "var(--surface-1)" },
        labelBgPadding: [6, 3],
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--series-violet)", width: 22, height: 22 },
      });
    });

    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  // Estado propio para nodos/aristas (en vez de pasárselos tal cual a ReactFlow): sin
  // onNodesChange, un arrastre se deshacía en el siguiente render que le llegara desde
  // fuera (p. ej. el refresco al recuperar el foco), porque React Flow no tenía dónde
  // guardar la posición nueva. Se reinicializan solo cuando cambia el layout de verdad.
  const [nodes, setNodes] = useState<Node[]>(baseNodes);
  const [edges, setEdges] = useState<Edge[]>(baseEdges);

  useEffect(() => {
    setNodes(baseNodes);
    setEdges(baseEdges);
  }, [baseNodes, baseEdges]);

  // Aplicar la selección no debe volver a correr el layout de fuerzas: solo marca/desmarca
  // el nodo ya calculado.
  useEffect(() => {
    setNodes((nds) => nds.map((n) => (n.type === "account" ? { ...n, selected: n.id === `account-${selected}` } : n)));
  }, [selected]);

  const incomeAccountId = useMemo(() => {
    const map = new Map<string, string>();
    for (const income of profile.incomes) map.set(`income-${income.id}`, `account-${income.account}`);
    return map;
  }, [profile.incomes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => {
        let applied = applyNodeChanges(changes, nds);
        applied = applied.map((n) => {
          if (n.type !== "income") return n;
          const accountId = incomeAccountId.get(n.id);
          const account = accountId ? applied.find((a) => a.id === accountId) : undefined;
          if (!account) return n;
          const maxX = account.position.x - INCOME_CLAMP_MARGIN;
          return n.position.x > maxX ? { ...n, position: { ...n.position, x: maxX } } : n;
        });
        if (changes.some((c) => c.type === "position" && c.dragging === false)) {
          onUpdateFlujoPositions(Object.fromEntries(applied.map((n) => [n.id, n.position])));
        }
        return applied;
      }),
    [incomeAccountId, onUpdateFlujoPositions],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

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
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--series-income)" }}>
            {formatEUR(totalIncome)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Traspasos al mes</p>
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--series-violet)" }}>
            {formatEUR(totalTransfers)}
          </p>
        </Card>
        <Card className="!p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Cuentas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{accounts.length}</p>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="rumbo-flow h-[62vh] min-h-[420px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
              <dd className="text-lg font-bold tabular-nums" style={{ color: "var(--series-income)" }}>
                {formatEUR(selectedBalance.income)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Traspasos entrantes</dt>
              <dd className="text-lg font-bold tabular-nums" style={{ color: "var(--series-violet)" }}>
                {formatEUR(selectedBalance.transfersIn)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Traspasos salientes</dt>
              <dd className="text-lg font-bold tabular-nums" style={{ color: "var(--series-expense)" }}>
                {formatEUR(selectedBalance.transfersOut)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Balance</dt>
              <dd
                className="text-lg font-bold tabular-nums"
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
