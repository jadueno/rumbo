import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Account, FinancialProfile } from "../../domain/types";
import { RecomendacionesScreen } from "./RecomendacionesScreen";

function baseProfile(overrides: Partial<FinancialProfile> = {}): FinancialProfile {
  return {
    age: 30,
    incomes: [],
    expenses: [],
    transfers: [],
    accountFlows: [],
    debts: [],
    emergencyFund: { targetMonths: 3 },
    ...overrides,
  };
}

const accounts: Account[] = [{ id: "1", name: "ING" }];

describe("RecomendacionesScreen", () => {
  it("con una tasa de ahorro nula, recomienda mejorarla en primer lugar (severidad alta)", () => {
    render(<RecomendacionesScreen profile={baseProfile()} accounts={accounts} trackers={[]} properties={[]} />);

    expect(screen.getByText("Tasa de ahorro/inversión baja")).toBeInTheDocument();
    expect(
      screen.queryByText("Todo en orden por ahora: no tenemos ninguna recomendación pendiente para ti."),
    ).not.toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Tasa de ahorro/inversión baja");
  });
});
