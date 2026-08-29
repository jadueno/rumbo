// Layout de fuerzas dirigidas, calculado una sola vez y de forma síncrona (no hay
// simulación continua: se corren N iteraciones y el resultado ya es la posición final).
// Los nodos de ingresos se fuerzan a quedar a la izquierda de su cuenta (restricción dura
// en cada iteración) para que el diagrama se lea como flujo entrada -> cuenta.

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: "account" | "income";
  accountId?: string; // solo en nodos "income": id del nodo cuenta al que alimentan
}

export interface LayoutEdge {
  source: string;
  target: string;
  rest: number;
  strength: number;
}

const REPULSION = 70000;
const CENTER_K = 0.0025;
const DAMPING = 0.82;
const INCOME_MARGIN = 190;

export function settleLayout(nodes: LayoutNode[], edges: LayoutEdge[], iterations = 260) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          distSq = 1;
        }
        const dist = Math.sqrt(distSq);
        const force = REPULSION / distSq;
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    for (const e of edges) {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const diff = dist - e.rest;
      const fx = (diff * e.strength * dx) / dist;
      const fy = (diff * e.strength * dy) / dist;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const n of nodes) {
      n.vx += (0 - n.x) * CENTER_K;
      n.vy += (0 - n.y) * CENTER_K;
    }

    for (const n of nodes) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    }

    // Restricción dura: cada ingreso queda a la izquierda de su cuenta.
    for (const n of nodes) {
      if (n.kind === "income" && n.accountId) {
        const account = byId.get(n.accountId);
        if (account && n.x > account.x - INCOME_MARGIN) {
          n.x = account.x - INCOME_MARGIN;
          n.vx = 0;
        }
      }
    }
  }

  return byId;
}
