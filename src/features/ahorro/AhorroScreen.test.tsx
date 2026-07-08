import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../components/ConfirmProvider";
import type { Account, FinancialProfile, Property, SavingsTracker } from "../../domain/types";
import { AhorroScreen } from "./AhorroScreen";

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

function renderScreen(profile: FinancialProfile, trackers: SavingsTracker[] = [], properties: Property[] = []) {
  const handlers = {
    onAddTracker: vi.fn().mockResolvedValue(undefined),
    onUpdateTracker: vi.fn().mockResolvedValue(undefined),
    onRemoveTracker: vi.fn().mockResolvedValue(undefined),
    onAddProperty: vi.fn().mockResolvedValue(undefined),
    onUpdateProperty: vi.fn().mockResolvedValue(undefined),
    onRemoveProperty: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <ConfirmProvider>
      <AhorroScreen profile={profile} accounts={accounts} trackers={trackers} properties={properties} {...handlers} />
    </ConfirmProvider>,
  );
  return handlers;
}

describe("AhorroScreen", () => {
  it("sin fondo de emergencia, inversiones ni propiedades, muestra los tres avisos vacíos", () => {
    renderScreen(baseProfile());
    expect(screen.getByText("Aún no tienes inversiones registradas.")).toBeInTheDocument();
    expect(screen.getByText("Aún no tienes propiedades registradas.")).toBeInTheDocument();
  });

  it("añade una propiedad y cierra el formulario", async () => {
    const user = userEvent.setup();
    const handlers = renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "+ Añadir propiedad" }));
    await user.type(screen.getByLabelText("Nombre"), "Piso Riviera");
    await user.type(screen.getByLabelText("Valor estimado de mercado (€)"), "150000");
    await user.click(screen.getByRole("button", { name: "Guardar propiedad" }));

    expect(handlers.onAddProperty).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Piso Riviera", estimatedValue: 150000 }),
    );
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("pide confirmación antes de dejar de seguir una inversión y solo la borra si se confirma", async () => {
    const user = userEvent.setup();
    const trackers: SavingsTracker[] = [
      { id: "t1", kind: "investment", name: "Indexado MSCI World", account: "ING", initialBalance: 1000, initialBalanceAsOf: "2026-01" },
    ];
    const handlers = renderScreen(baseProfile(), trackers);

    await user.click(screen.getByRole("button", { name: "Eliminar inversión Indexado MSCI World" }));
    expect(screen.getByText(/¿Dejar de seguir "Indexado MSCI World"\?/)).toBeInTheDocument();
    expect(handlers.onRemoveTracker).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(handlers.onRemoveTracker).toHaveBeenCalledWith("t1");
  });

  it("pide confirmación antes de borrar una propiedad y no la borra si se cancela", async () => {
    const user = userEvent.setup();
    const properties: Property[] = [{ id: "p1", name: "Piso Riviera", estimatedValue: 150000 }];
    const handlers = renderScreen(baseProfile(), [], properties);

    await user.click(screen.getByRole("button", { name: "Eliminar propiedad Piso Riviera" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(handlers.onRemoveProperty).not.toHaveBeenCalled();
    expect(screen.getByText("Piso Riviera")).toBeInTheDocument();
  });
});
