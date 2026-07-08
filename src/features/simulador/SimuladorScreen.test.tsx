import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Account, FinancialProfile, SavingsTracker } from "../../domain/types";
import { SimuladorScreen } from "./SimuladorScreen";

function baseProfile(overrides: Partial<FinancialProfile> = {}): FinancialProfile {
  return {
    age: 30,
    incomes: [{ id: "i1", account: "ING", label: "Nómina", monthlyAmount: 2000 }],
    expenses: [{ id: "e1", group: "Fijos", account: "ING", label: "Alquiler", monthlyAmount: 800 }],
    transfers: [],
    debts: [],
    emergencyFund: { targetMonths: 3 },
    ...overrides,
  };
}

const accounts: Account[] = [{ id: "1", name: "ING" }];
const trackers: SavingsTracker[] = [];

describe("SimuladorScreen", () => {
  it("sin ajustes, no muestra el botón de restablecer", () => {
    render(<SimuladorScreen profile={baseProfile()} accounts={accounts} trackers={trackers} />);
    expect(screen.queryByRole("button", { name: "Restablecer" })).not.toBeInTheDocument();
  });

  it("al mover un slider, actualiza el valor mostrado y aparece 'Restablecer'; al pulsarlo, vuelve a 0", async () => {
    const user = userEvent.setup();
    render(<SimuladorScreen profile={baseProfile()} accounts={accounts} trackers={trackers} />);

    const incomeSlider = screen.getByLabelText(/Ajuste de ingresos mensuales/) as HTMLInputElement;
    fireEvent.change(incomeSlider, { target: { value: "500" } });

    expect(incomeSlider.value).toBe("500");
    const resetButton = screen.getByRole("button", { name: "Restablecer" });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(screen.queryByRole("button", { name: "Restablecer" })).not.toBeInTheDocument();
  });
});
