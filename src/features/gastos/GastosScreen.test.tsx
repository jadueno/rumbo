import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../components/ConfirmProvider";
import type { Account, FinancialProfile, Property } from "../../domain/types";
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

const accounts: Account[] = [
  { id: "1", name: "ING" },
  { id: "2", name: "Ibercaja" },
];
const properties: Property[] = [];

function renderScreen(profile: FinancialProfile) {
  const handlers = {
    onAddAccount: vi.fn().mockResolvedValue(undefined),
    onUpdateAccount: vi.fn().mockResolvedValue(undefined),
    onRemoveAccount: vi.fn().mockResolvedValue(undefined),
    onAddIncome: vi.fn().mockResolvedValue(undefined),
    onUpdateIncome: vi.fn().mockResolvedValue(undefined),
    onRemoveIncome: vi.fn().mockResolvedValue(undefined),
    onAddExpense: vi.fn().mockResolvedValue(undefined),
    onUpdateExpense: vi.fn().mockResolvedValue(undefined),
    onRemoveExpense: vi.fn().mockResolvedValue(undefined),
    onAddTransfer: vi.fn().mockResolvedValue(undefined),
    onRemoveTransfer: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <ConfirmProvider>
      <GastosScreen profile={profile} accounts={accounts} properties={properties} {...handlers} />
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

  it("también se puede borrar un ingreso desde la tarjeta de su cuenta, no solo desde la lista de arriba", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      incomes: [{ id: "i1", account: "ING", label: "Nómina", monthlyAmount: 2000 }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Eliminar ingreso Nómina de ING" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(handlers.onRemoveIncome).toHaveBeenCalledWith("i1");
  });

  it("permite editar un gasto existente desde su tarjeta", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      expenses: [{ id: "e1", group: "Fijos", account: "ING", label: "Alquiler", monthlyAmount: 500 }],
    });
    const handlers = renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Editar gasto Alquiler" }));
    const label = screen.getByLabelText("Concepto");
    expect(label).toHaveValue("Alquiler");
    await user.clear(label);
    await user.type(label, "Alquiler piso");
    const amount = screen.getByLabelText("Importe mensual (€)");
    await user.clear(amount);
    await user.type(amount, "550");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(handlers.onUpdateExpense).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({ account: "ING", label: "Alquiler piso", monthlyAmount: 550 }),
    );
  });

  it("permite renombrar una cuenta desde su tarjeta", async () => {
    const user = userEvent.setup();
    const handlers = renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "Editar cuenta ING" }));
    const input = screen.getByLabelText("Renombrar cuenta ING");
    await user.clear(input);
    await user.type(input, "ING - Ahorro");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(handlers.onUpdateAccount).toHaveBeenCalledWith("1", { name: "ING - Ahorro" });
  });

  it("abre el alta de gasto en un modal", async () => {
    const user = userEvent.setup();
    renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "+ Añadir gasto" }));

    expect(screen.getByRole("dialog", { name: "Añadir gasto" })).toBeInTheDocument();
  });

  it("editar un gasto abre un modal titulado 'Editar gasto'", async () => {
    const user = userEvent.setup();
    const profile = baseProfile({
      expenses: [{ id: "e1", group: "Fijos", account: "ING", label: "Alquiler", monthlyAmount: 500 }],
    });
    renderScreen(profile);

    await user.click(screen.getByRole("button", { name: "Editar gasto Alquiler" }));

    expect(screen.getByRole("dialog", { name: "Editar gasto" })).toBeInTheDocument();
  });

  it("el botón + Gasto de una cuenta abre el modal con esa cuenta ya elegida", async () => {
    const user = userEvent.setup();
    renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "Añadir gasto a Ibercaja" }));

    expect(screen.getByLabelText("Cuenta")).toHaveValue("Ibercaja");
  });

  it("el botón + Transferencia de una cuenta abre el modal con esa cuenta como origen", async () => {
    const user = userEvent.setup();
    const handlers = renderScreen(baseProfile());

    await user.click(screen.getByRole("button", { name: "Añadir transferencia desde Ibercaja" }));
    expect(screen.getByLabelText("Desde")).toHaveValue("Ibercaja");

    await user.type(screen.getByLabelText("Importe mensual (€)"), "50");
    await user.click(screen.getByRole("button", { name: "Guardar transferencia" }));

    expect(handlers.onAddTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ fromAccount: "Ibercaja", toAccount: "ING" }),
    );
  });
});
