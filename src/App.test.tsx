import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { clearStoredToken } from "./data/auth";

const { getAuthConfig, login } = vi.hoisted(() => ({
  getAuthConfig: vi.fn(),
  login: vi.fn(),
}));

vi.mock("./data/api", () => ({
  getAuthConfig,
  login,
  logout: vi.fn(),
}));

// Perfil vacío y sin fetches reales — este test solo verifica la puerta de login
// delante de todo lo demás, no el contenido de cada pantalla (ya cubierto por sus
// propios tests).
vi.mock("./data/useFinancialData", () => ({
  useFinancialData: () => ({
    profile: {
      age: 30,
      incomes: [],
      expenses: [],
      transfers: [],
      debts: [],
      emergencyFund: { targetMonths: 3 },
    },
    rawProfile: { name: "Tu nombre", birthDate: "1990-01-01", emergencyFundTargetMonths: 3 },
    accounts: [],
    trackers: [],
    properties: [],
    loading: false,
    error: null,
    updateProfile: vi.fn(),
    addAccount: vi.fn(),
    removeAccount: vi.fn(),
    addIncome: vi.fn(),
    updateIncome: vi.fn(),
    removeIncome: vi.fn(),
    addExpense: vi.fn(),
    removeExpense: vi.fn(),
    addTransfer: vi.fn(),
    removeTransfer: vi.fn(),
    addDebt: vi.fn(),
    removeDebt: vi.fn(),
    addTracker: vi.fn(),
    updateTracker: vi.fn(),
    removeTracker: vi.fn(),
    addProperty: vi.fn(),
    updateProperty: vi.fn(),
    removeProperty: vi.fn(),
  }),
}));

describe("App — puerta de login", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.clearAllMocks();
  });

  it("si el backend no exige login, se salta el login y se ve la app directamente", async () => {
    getAuthConfig.mockResolvedValue({ loginRequired: false });
    render(<App />);

    expect(await screen.findByRole("button", { name: "Ingresos y Gastos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("si el backend exige login y no hay sesión guardada, muestra la pantalla de login", async () => {
    getAuthConfig.mockResolvedValue({ loginRequired: true });
    render(<App />);

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ingresos y Gastos" })).not.toBeInTheDocument();
  });

  it("iniciar sesión correctamente da paso a la app", async () => {
    const user = userEvent.setup();
    getAuthConfig.mockResolvedValue({ loginRequired: true });
    login.mockResolvedValue(undefined);
    render(<App />);

    await user.type(await screen.findByLabelText("Usuario"), "jadueno");
    await user.type(screen.getByLabelText("Contraseña"), "correcta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledWith("jadueno", "correcta");
    expect(await screen.findByRole("button", { name: "Ingresos y Gastos" })).toBeInTheDocument();
  });

  it("con contraseña incorrecta, muestra el error y no entra", async () => {
    const user = userEvent.setup();
    getAuthConfig.mockResolvedValue({ loginRequired: true });
    login.mockRejectedValue(new Error("Usuario o contraseña incorrectos"));
    render(<App />);

    await user.type(await screen.findByLabelText("Usuario"), "jadueno");
    await user.type(screen.getByLabelText("Contraseña"), "mal");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Usuario o contraseña incorrectos")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ingresos y Gastos" })).not.toBeInTheDocument();
  });

  it("el botón de cerrar sesión vuelve a mostrar el login", async () => {
    const user = userEvent.setup();
    getAuthConfig.mockResolvedValue({ loginRequired: true });
    login.mockResolvedValue(undefined);
    render(<App />);

    await user.type(await screen.findByLabelText("Usuario"), "jadueno");
    await user.type(screen.getByLabelText("Contraseña"), "correcta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("button", { name: "Ingresos y Gastos" })).toBeInTheDocument();

    // Hay dos botones de "Cerrar sesión" en el DOM (barra lateral de escritorio + barra
    // inferior de móvil, ambas siempre presentes — la que se ve según el tamaño de
    // pantalla la decide el CSS, que estos tests no aplican): cualquiera de los dos cierra
    // la sesión igual.
    const [logoutButton] = screen.getAllByRole("button", { name: "Cerrar sesión" });
    await user.click(logoutButton);
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
