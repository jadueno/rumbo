import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../components/ConfirmProvider";
import type { Account, FinancialProfile } from "../../domain/types";
import { GastosScreen } from "./GastosScreen";

function baseProfile(overrides: Partial<FinancialProfile> = {}): FinancialProfile {
  return {
    age: 30,
    incomes: [],
    expenses: [],
    transfers: [],
    debts: [],
    emergencyFund: { targetMonths: 3 },
    ...overrides,
  };
}

const accounts: Account[] = [{ id: "1", name: "ING" }];

function renderScreen(profile: FinancialProfile) {
  const handlers = {
    onAddAccount: vi.fn().mockResolvedValue(undefined),
    onRemoveAccount: vi.fn().mockResolvedValue(undefined),
    onAddIncome: vi.fn().mockResolvedValue(undefined),
    onUpdateIncome: vi.fn().mockResolvedValue(undefined),
    onRemoveIncome: vi.fn().mockResolvedValue(undefined),
    onAddExpense: vi.fn().mockResolvedValue(undefined),
    onRemoveExpense: vi.fn().mockResolvedValue(undefined),
    onAddTransfer: vi.fn().mockResolvedValue(undefined),
    onRemoveTransfer: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <ConfirmProvider>
      <GastosScreen profile={profile} accounts={accounts} {...handlers} />
    </ConfirmProvider>,
  );
  return handlers;
}

describe("GastosScreen", () => {
  it("abre el formulario de gasto, lo envía y se cierra", async () => {
    const user = userEvent.setup();
    const handlers = renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "+ Añadir gasto" }));
    await user.type(screen.getByLabelText("Concepto"), "Gimnasio");
    await user.type(screen.getByLabelText("Importe mensual (€)"), "35");
    await user.click(screen.getByRole("button", { name: "Guardar gasto" }));

    expect(handlers.onAddExpense).toHaveBeenCalledWith(
      expect.objectContaining({ account: "ING", label: "Gimnasio", monthlyAmount: 35 }),
    );
    expect(screen.queryByLabelText("Concepto")).not.toBeInTheDocument();
  });

  it("pide confirmación antes de borrar un gasto y solo lo borra si se confirma", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      expenses: [{ id: "e1", group: "Fijos", account: "ING", label: "Alquiler", monthlyAmount: 500 }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Eliminar gasto Alquiler" }));
    expect(screen.getByText(/¿Eliminar el gasto "Alquiler"\?/)).toBeInTheDocument();
    expect(handlers.onRemoveExpense).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(handlers.onRemoveExpense).toHaveBeenCalledWith("e1");
  });

  it("no borra el gasto si se cancela la confirmación", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      expenses: [{ id: "e1", group: "Fijos", account: "ING", label: "Alquiler", monthlyAmount: 500 }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Eliminar gasto Alquiler" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(handlers.onRemoveExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Alquiler")).toBeInTheDocument();
  });
});
