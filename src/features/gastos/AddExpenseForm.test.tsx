import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Property } from "../../domain/types";
import { AddExpenseForm } from "./AddExpenseForm";

const properties: Property[] = [{ id: "p1", name: "Riviera", estimatedValue: 150000 }];

describe("AddExpenseForm", () => {
  it("envía el gasto con los datos del formulario y luego cancela (cierra) el formulario", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    render(
      <AddExpenseForm accountNames={["ING", "Bankinter"]} properties={[]} onSubmit={onSubmit} onCancel={onCancel} />,
    );

    await user.selectOptions(screen.getByLabelText("Cuenta"), "Bankinter");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Variables");
    await user.type(screen.getByLabelText("Concepto"), "Gimnasio");
    await user.type(screen.getByLabelText("Importe mensual (€)"), "35");
    await user.click(screen.getByRole("button", { name: "Guardar gasto" }));

    expect(onSubmit).toHaveBeenCalledWith({
      account: "Bankinter",
      group: "Variables",
      property: undefined,
      propertyId: undefined,
      label: "Gimnasio",
      monthlyAmount: 35,
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("vincula el gasto a una propiedad real elegida en el desplegable", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddExpenseForm accountNames={["ING"]} properties={properties} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Concepto"), "Hipoteca");
    await user.type(screen.getByLabelText("Importe mensual (€)"), "400");
    await user.selectOptions(screen.getByLabelText("Vincular a una propiedad (opcional)"), "Riviera");
    await user.click(screen.getByRole("button", { name: "Guardar gasto" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ propertyId: "p1" }));
  });

  it("muestra un error y no cierra el formulario si onSubmit falla", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("La cuenta no existe"));
    const onCancel = vi.fn();
    render(<AddExpenseForm accountNames={["ING"]} properties={[]} onSubmit={onSubmit} onCancel={onCancel} />);

    await user.type(screen.getByLabelText("Concepto"), "Gimnasio");
    await user.type(screen.getByLabelText("Importe mensual (€)"), "35");
    await user.click(screen.getByRole("button", { name: "Guardar gasto" }));

    expect(await screen.findByText("La cuenta no existe")).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancela sin llamar a onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<AddExpenseForm accountNames={["ING"]} properties={[]} onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("avisa de que hace falta una cuenta cuando no hay ninguna", () => {
    render(<AddExpenseForm accountNames={[]} properties={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Primero crea una cuenta.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar gasto" })).toBeDisabled();
  });
});
