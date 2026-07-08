import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../components/ConfirmProvider";
import type { FinancialProfile } from "../../domain/types";
import { DeudasScreen } from "./DeudasScreen";

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

function renderScreen(profile: FinancialProfile) {
  const handlers = {
    onAddDebt: vi.fn().mockResolvedValue(undefined),
    onRemoveDebt: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <ConfirmProvider>
      <DeudasScreen profile={profile} {...handlers} />
    </ConfirmProvider>,
  );
  return handlers;
}

describe("DeudasScreen", () => {
  it("sin deudas, muestra el aviso de que no hay ninguna registrada", () => {
    renderScreen(baseProfile());
    expect(screen.getByText("No tienes deudas registradas.")).toBeInTheDocument();
  });

  it("abre el formulario, lo envía y se cierra", async () => {
    const user = userEvent.setup();
    const handlers = renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "+ Añadir deuda" }));
    await user.type(screen.getByLabelText("Nombre"), "Préstamo coche");
    await user.type(screen.getByLabelText("Cuota mensual (€)"), "200");
    await user.type(screen.getByLabelText("Hasta"), "2028-06");
    await user.click(screen.getByRole("button", { name: "Guardar deuda" }));

    expect(handlers.onAddDebt).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Préstamo coche", monthlyPayment: 200, dueDate: "2028-06" }),
    );
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("pide confirmación antes de borrar una deuda y solo la borra si se confirma", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      debts: [{ id: "d1", name: "Hipoteca", monthlyPayment: 600, dueDate: "2040-01" }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Eliminar deuda Hipoteca" }));
    expect(screen.getByText(/¿Eliminar la deuda "Hipoteca"\?/)).toBeInTheDocument();
    expect(handlers.onRemoveDebt).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(handlers.onRemoveDebt).toHaveBeenCalledWith("d1");
  });

  it("no borra la deuda si se cancela la confirmación", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      debts: [{ id: "d1", name: "Hipoteca", monthlyPayment: 600, dueDate: "2040-01" }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Eliminar deuda Hipoteca" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(handlers.onRemoveDebt).not.toHaveBeenCalled();
    expect(screen.getByText("Hipoteca")).toBeInTheDocument();
  });
});
