import { useState } from "react";
import type { Account, FinancialProfile, NewAccount, NewExpenseItem, NewIncomeSource, NewTransfer } from "../../domain/types";
import { balanceByAccount, formatEUR, totalMonthlyExpenses, totalMonthlyIncome } from "../../domain/calculations";
import { Card } from "../../components/Card";
import { useConfirm } from "../../components/ConfirmProvider";
import { AddIncomeForm } from "./AddIncomeForm";
import { AddExpenseForm } from "./AddExpenseForm";
import { AddTransferForm } from "./AddTransferForm";
import { AddAccountForm } from "./AddAccountForm";

interface Props {
  profile: FinancialProfile;
  accounts: Account[];
  onAddAccount: (account: NewAccount) => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  onAddIncome: (income: NewIncomeSource) => Promise<void>;
  onUpdateIncome: (id: string, income: NewIncomeSource) => Promise<void>;
  onRemoveIncome: (id: string) => Promise<void>;
  onAddExpense: (expense: NewExpenseItem) => Promise<void>;
  onRemoveExpense: (id: string) => Promise<void>;
  onAddTransfer: (transfer: NewTransfer) => Promise<void>;
  onRemoveTransfer: (id: string) => Promise<void>;
}

export function GastosScreen({
  profile,
  accounts,
  onAddAccount,
  onRemoveAccount,
  onAddIncome,
  onUpdateIncome,
  onRemoveIncome,
  onAddExpense,
  onRemoveExpense,
  onAddTransfer,
  onRemoveTransfer,
}: Props) {
  const confirm = useConfirm();
  const [openForm, setOpenForm] = useState<"income" | "expense" | "transfer" | "account" | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const totalIncome = totalMonthlyIncome(profile);
  const totalExpenses = totalMonthlyExpenses(profile);
  const accountNames = accounts.map((a) => a.name);
  const accountBalances = balanceByAccount(profile, accountNames);

  async function handleRemoveIncome(label: string, id: string) {
    if (await confirm(`¿Eliminar el ingreso "${label}"? Esta acción no se puede deshacer.`)) {
      await onRemoveIncome(id);
    }
  }

  async function handleRemoveExpense(label: string, id: string) {
    if (await confirm(`¿Eliminar el gasto "${label}"? Esta acción no se puede deshacer.`)) {
      await onRemoveExpense(id);
    }
  }

  async function handleRemoveTransfer(id: string) {
    if (await confirm("¿Eliminar esta transferencia? Esta acción no se puede deshacer.")) {
      await onRemoveTransfer(id);
    }
  }

  async function handleRemoveAccount(account: Account) {
    if (!(await confirm(`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`))) return;
    setAccountError(null);
    try {
      await onRemoveAccount(account.id);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "No se ha podido eliminar la cuenta");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ingresos y Gastos</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">
          Ingresas <strong className="font-bold text-[var(--text-primary)]">{formatEUR(totalIncome)}</strong>{" "}
          y te queda por pagar{" "}
          <strong className="font-bold text-[var(--text-primary)]">{formatEUR(totalExpenses)}</strong> al mes.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ingresos</h2>
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--series-income)" }}>
            {formatEUR(totalIncome)}
          </p>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Edita, añade o quita cualquier ingreso: el resto de la app (cuentas, ahorro, deudas,
          recomendaciones) se recalcula solo.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {profile.incomes.map((income) => (
            <li key={income.id} className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium text-[var(--text-primary)]">{income.label}</p>
                <p className="text-[var(--text-muted)]">{income.account}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  aria-label={`Importe mensual de ${income.label}`}
                  value={income.monthlyAmount}
                  onChange={(e) =>
                    onUpdateIncome(income.id, {
                      account: income.account,
                      label: income.label,
                      monthlyAmount: Number(e.target.value),
                    })
                  }
                  className="w-28 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--series-income)]"
                />
                <span className="text-sm text-[var(--text-muted)]">€</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIncome(income.label, income.id)}
                  aria-label={`Eliminar ingreso ${income.label}`}
                  className="ml-1 text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>

        {openForm === "income" ? (
          <AddIncomeForm accountNames={accountNames} onSubmit={onAddIncome} onCancel={() => setOpenForm(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setOpenForm("income")}
            className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--series-income)" }}
          >
            + Añadir ingreso
          </button>
        )}
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Por cuenta bancaria</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpenForm(openForm === "account" ? null : "account")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--series-savings)" }}
            >
              + Añadir cuenta
            </button>
            <button
              type="button"
              onClick={() => setOpenForm(openForm === "expense" ? null : "expense")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--series-expense)" }}
            >
              + Añadir gasto
            </button>
            <button
              type="button"
              onClick={() => setOpenForm(openForm === "transfer" ? null : "transfer")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--series-violet)" }}
            >
              + Añadir transferencia
            </button>
          </div>
        </div>

        {openForm === "account" && (
          <Card className="mb-4">
            <AddAccountForm onSubmit={onAddAccount} onCancel={() => setOpenForm(null)} />
          </Card>
        )}
        {openForm === "expense" && (
          <Card className="mb-4">
            <AddExpenseForm accountNames={accountNames} onSubmit={onAddExpense} onCancel={() => setOpenForm(null)} />
          </Card>
        )}
        {openForm === "transfer" && (
          <Card className="mb-4">
            <AddTransferForm accountNames={accountNames} onSubmit={onAddTransfer} onCancel={() => setOpenForm(null)} />
          </Card>
        )}
        {accountError && (
          <p className="mb-4 text-sm" style={{ color: "var(--status-critical)" }}>
            {accountError}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {accountBalances.map(({ account, income, expenses, balance }) => {
            const items = profile.expenses.filter((e) => e.account === account);
            const incomeItems = profile.incomes.filter((i) => i.account === account);
            const transfersOut = profile.transfers.filter((t) => t.fromAccount === account);
            const transfersIn = profile.transfers.filter((t) => t.toAccount === account);
            const accountEntity = accounts.find((a) => a.name === account);

            const balanceColor = balance >= 0 ? "var(--series-savings)" : "var(--series-expense)";

            return (
              <Card key={account}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{account}</h3>
                    {accountEntity && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(accountEntity)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
                      >
                        Eliminar cuenta
                      </button>
                    )}
                  </div>
                  <p className="text-xl font-bold tabular-nums" style={{ color: balanceColor }}>
                    {formatEUR(balance)}
                  </p>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-[var(--text-secondary)]">
                  <span>
                    Ingresos:{" "}
                    <strong className="font-bold text-[var(--text-primary)]">{formatEUR(income)}</strong>
                  </span>
                  <span>
                    Gastos:{" "}
                    <strong className="font-bold text-[var(--text-primary)]">{formatEUR(expenses)}</strong>
                  </span>
                </div>

                {incomeItems.length === 0 &&
                transfersIn.length === 0 &&
                transfersOut.length === 0 &&
                items.length === 0 ? (
                  <p className="mt-4 border-t border-[var(--gridline)] pt-3 text-sm text-[var(--text-muted)]">
                    Sin movimientos todavía.
                  </p>
                ) : null}

                {incomeItems.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {incomeItems.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-secondary)]">{i.label}</span>
                        <span className="tabular-nums font-medium" style={{ color: "var(--series-income)" }}>
                          +{formatEUR(i.monthlyAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {transfersIn.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {transfersIn.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-secondary)]">← Transferencia de {t.fromAccount}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums font-medium" style={{ color: "var(--series-violet)" }}>
                            +{formatEUR(t.monthlyAmount)}
                          </span>
                          <DeleteButton onClick={() => handleRemoveTransfer(t.id)} label="Eliminar transferencia" />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {transfersOut.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {transfersOut.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-secondary)]">→ Transferencia a {t.toAccount}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums font-medium" style={{ color: "var(--series-violet)" }}>
                            −{formatEUR(t.monthlyAmount)}
                          </span>
                          <DeleteButton onClick={() => handleRemoveTransfer(t.id)} label="Eliminar transferencia" />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {items.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--gridline)] pt-3 text-sm">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-primary)]">
                          {item.label}
                          {item.property && item.property !== "General" ? (
                            <span className="ml-2 text-xs text-[var(--text-muted)]">({item.property})</span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums font-medium text-[var(--text-primary)]">
                            −{formatEUR(item.monthlyAmount)}
                          </span>
                          <DeleteButton
                            onClick={() => handleRemoveExpense(item.label, item.id)}
                            label={`Eliminar gasto ${item.label}`}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
    >
      ×
    </button>
  );
}
