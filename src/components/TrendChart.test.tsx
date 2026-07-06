import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendChart } from "./TrendChart";

describe("TrendChart", () => {
  it("con 0 puntos, avisa de que no hay snapshots en vez de dibujar un gráfico vacío", () => {
    render(<TrendChart label="Patrimonio" points={[]} color="red" formatValue={String} />);
    expect(screen.getByText("Todavía no hay snapshots guardados.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("con 1 punto, muestra el valor como cifra grande en vez de una línea sin sentido", () => {
    render(
      <TrendChart label="Patrimonio" points={[{ month: "2026-07", value: 1000 }]} color="red" formatValue={String} />,
    );
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText(/guarda al menos un mes más/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("con 2+ puntos, dibuja el gráfico de línea con su etiqueta de accesibilidad", () => {
    render(
      <TrendChart
        label="Patrimonio"
        points={[
          { month: "2026-06", value: 1000 },
          { month: "2026-07", value: 1200 },
        ]}
        color="red"
        formatValue={(v) => `${v}€`}
      />,
    );
    expect(screen.getByRole("img", { name: /Patrimonio: evolución de 1000€ a 1200€/ })).toBeInTheDocument();
  });
});
