import { useMemo, useState } from "react";
import type { ExpenseGroup, ExpenseItem, NewExpenseItem } from "../../domain/types";
import { formatEUR } from "../../domain/calculations";
import {
  groupMovements,
  matchExistingExpense,
  type ConceptGroup,
  type RawMovement,
} from "../../domain/statementImport";
import { readStatementSections } from "../../data/readStatementFile";
import { Field, focusRing, inputClass } from "../../components/Field";
import { Button } from "../../components/Button";

interface Props {
  accountNames: string[];
  expenses: ExpenseItem[];
  onAddExpense: (expense: NewExpenseItem) => Promise<void>;
  onClose: () => void;
}

interface SectionData {
  sourceLabel: string;
  movements: RawMovement[];
}

export function ImportStatementModal({ accountNames, expenses, onAddExpense, onClose }: Props) {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [sectionAccounts, setSectionAccounts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [onlyRecurring, setOnlyRecurring] = useState(true);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setStatus("loading");
    setError(null);
    try {
      const parsedPerFile = await Promise.all(files.map(readStatementSections));
      const merged = new Map<string, RawMovement[]>();
      for (const fileSections of parsedPerFile) {
        for (const section of fileSections) {
          const existing = merged.get(section.sourceLabel);
          if (existing) existing.push(...section.movements);
          else merged.set(section.sourceLabel, [...section.movements]);
        }
      }
      const sectionList = Array.from(merged.entries()).map(([sourceLabel, movements]) => ({
        sourceLabel,
        movements,
      }));
      if (sectionList.length === 0) {
        throw new Error(
          "No se han reconocido movimientos. Comprueba que sea un extracto de movimientos exportado del banco.",
        );
      }
      // Un solo extracto mensual (p. ej. Bankinter) nunca tiene gastos "recurrentes en 2+
      // meses": si no hay más de un mes de datos, el filtro por defecto dejaría la lista vacía.
      const spansMultipleMonths = sectionList.some((s) => groupMovements(s.movements).monthsInRange >= 2);
      setOnlyRecurring(spansMultipleMonths);
      setSections(sectionList);
      setSectionAccounts((prev) => {
        const next = { ...prev };
        for (const s of sectionList) {
          if (!next[s.sourceLabel]) next[s.sourceLabel] = accountNames[0] ?? "";
        }
        return next;
      });
      setAddedKeys(new Set());
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido leer el archivo");
      setStatus("error");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar movimientos bancarios"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 backdrop-blur-sm"
      style={{ overscrollBehavior: "contain" }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-float">
        <div className="flex items-start justify-between border-b border-[var(--gridline)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Importar movimientos bancarios</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Sube el extracto del banco (varios meses o varios archivos) para detectar gastos que no tengas
              apuntados. En <strong>.xls</strong>/<strong>.xlsx</strong>/<strong>.csv</strong> funciona con cualquier
              banco (ING, Ibercaja...); en <strong>.pdf</strong>, de momento solo Bankinter y BBVA. Si el archivo trae
              varias cuentas, podrás asignar cada una a la cuenta de la app que corresponda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--gridline)] ${focusRing}`}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Field label="Archivo(s) (.xls, .xlsx, .csv o .pdf)">
            <input
              type="file"
              multiple
              accept=".xls,.xlsx,.csv,.pdf"
              onChange={handleFiles}
              className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-[var(--gridline)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--text-primary)]`}
            />
          </Field>

          {status === "loading" && <p className="mt-4 text-sm text-[var(--text-muted)]">Leyendo archivo…</p>}
          {error && (
            <p className="mt-4 text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}

          {sections.length > 0 && (
            <div className="mt-5 flex flex-col gap-6">
              <label className="flex items-center gap-1.5 self-start text-xs text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={onlyRecurring}
                  onChange={(e) => setOnlyRecurring(e.target.checked)}
                />
                Solo gastos que se repiten en 2+ meses
              </label>

              {sections.map((section) => (
                <SectionResults
                  key={section.sourceLabel}
                  section={section}
                  accountNames={accountNames}
                  assignedAccount={sectionAccounts[section.sourceLabel] ?? accountNames[0] ?? ""}
                  onAssignAccount={(account) =>
                    setSectionAccounts((prev) => ({ ...prev, [section.sourceLabel]: account }))
                  }
                  expenses={expenses}
                  onlyRecurring={onlyRecurring}
                  addedKeys={addedKeys}
                  onAdd={async (conceptKey, expense) => {
                    await onAddExpense(expense);
                    setAddedKeys((prev) => new Set(prev).add(`${section.sourceLabel}::${conceptKey}`));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionResults({
  section,
  accountNames,
  assignedAccount,
  onAssignAccount,
  expenses,
  onlyRecurring,
  addedKeys,
  onAdd,
}: {
  section: SectionData;
  accountNames: string[];
  assignedAccount: string;
  onAssignAccount: (account: string) => void;
  expenses: ExpenseItem[];
  onlyRecurring: boolean;
  addedKeys: Set<string>;
  onAdd: (conceptKey: string, expense: NewExpenseItem) => Promise<void>;
}) {
  const grouped = useMemo(() => groupMovements(section.movements), [section.movements]);
  const accountExpenses = useMemo(
    () => expenses.filter((e) => e.account === assignedAccount),
    [expenses, assignedAccount],
  );

  const { untracked, tracked } = useMemo(() => {
    const visible = onlyRecurring ? grouped.groups.filter((g) => g.monthsSeen >= 2) : grouped.groups;
    const untrackedList: ConceptGroup[] = [];
    const trackedList: { concept: ConceptGroup; match: ExpenseItem }[] = [];
    for (const g of visible) {
      const match = matchExistingExpense(g, accountExpenses);
      if (match) trackedList.push({ concept: g, match });
      else untrackedList.push(g);
    }
    return { untracked: untrackedList, tracked: trackedList };
  }, [grouped, accountExpenses, onlyRecurring]);

  return (
    <div className="rounded-2xl border border-[var(--gridline)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section.sourceLabel}</h3>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          Asignar a
          <select value={assignedAccount} onChange={(e) => onAssignAccount(e.target.value)} className={inputClass}>
            {accountNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {grouped.monthsInRange} {grouped.monthsInRange === 1 ? "mes analizado" : "meses analizados"} ·{" "}
        {grouped.totalExpenseMovements} movimientos de gasto
      </p>

      <div className="mt-4 flex flex-col gap-6">
        <section>
          <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
            No tienes esto apuntado ({untracked.length})
          </h4>
          {untracked.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Nada por aquí: todo lo relevante ya lo tienes apuntado.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {untracked.map((g) => (
                <UntrackedRow
                  key={g.key}
                  concept={g}
                  account={assignedAccount}
                  added={addedKeys.has(`${section.sourceLabel}::${g.key}`)}
                  onAdd={(expense) => onAdd(g.key, expense)}
                />
              ))}
            </ul>
          )}
        </section>

        {tracked.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Ya los tienes apuntados ({tracked.length})
            </h4>
            <ul className="flex flex-col gap-2">
              {tracked.map(({ concept, match }) => {
                const delta = concept.monthlyAverage - match.monthlyAmount;
                const bigDelta = Math.abs(delta) >= Math.max(5, match.monthlyAmount * 0.2);
                return (
                  <li key={concept.key} className="rounded-2xl border border-[var(--gridline)] p-3 text-sm">
                    <p className="text-[var(--text-primary)]">
                      {concept.label} <span className="text-[var(--text-muted)]">→ apuntado como "{match.label}"</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Llevas {formatEUR(match.monthlyAmount)}/mes apuntado · el banco muestra{" "}
                      {formatEUR(concept.monthlyAverage)}/mes de media
                      {bigDelta && <strong style={{ color: "var(--status-critical)" }}> (diferencia notable)</strong>}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function UntrackedRow({
  concept,
  account,
  added,
  onAdd,
}: {
  concept: ConceptGroup;
  account: string;
  added: boolean;
  onAdd: (expense: NewExpenseItem) => Promise<void>;
}) {
  const [group, setGroup] = useState<ExpenseGroup>("Variables");
  const [label, setLabel] = useState(concept.label);
  const [amount, setAmount] = useState(concept.monthlyAverage);
  const [submitting, setSubmitting] = useState(false);

  return (
    <li className="rounded-2xl border border-[var(--gridline)] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{concept.label}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {concept.subcategory || concept.category || "Sin categoría"} · visto en {concept.monthsSeen}{" "}
            {concept.monthsSeen === 1 ? "mes" : "meses"}
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
          {formatEUR(concept.monthlyAverage)}/mes
        </p>
      </div>

      {added ? (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--status-good)" }}>
          Añadido a tus gastos ✓
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Concepto"
            className={`${inputClass} w-40`}
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as ExpenseGroup)}
            className={`${inputClass} w-32`}
          >
            <option value="Fijos">Obligatorio</option>
            <option value="Variables">Opcional</option>
          </select>
          <input
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Importe mensual"
            className={`${inputClass} w-24 text-right`}
          />
          <Button
            tone="expense"
            variant="tint"
            size="sm"
            disabled={submitting || !label}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onAdd({ account, group, label, monthlyAmount: amount });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Añadiendo…" : "+ Añadir"}
          </Button>
        </div>
      )}
    </li>
  );
}
