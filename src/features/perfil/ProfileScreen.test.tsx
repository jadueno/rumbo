import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "../../domain/types";
import { ProfileScreen } from "./ProfileScreen";

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return { name: "Juan", birthDate: "1990-06-01", emergencyFundTargetMonths: 3, ...overrides };
}

describe("ProfileScreen", () => {
  it("muestra la edad calculada a partir de la fecha de nacimiento", () => {
    render(<ProfileScreen profile={baseProfile()} onUpdateProfile={vi.fn()} />);
    expect(screen.getByText(/Edad calculada:/)).toBeInTheDocument();
  });

  it("envía el formulario con los valores editados", async () => {
    const user = userEvent.setup();
    const onUpdateProfile = vi.fn().mockResolvedValue(undefined);
    render(<ProfileScreen profile={baseProfile()} onUpdateProfile={onUpdateProfile} />);

    const nameInput = screen.getByLabelText("Nombre");
    await user.clear(nameInput);
    await user.type(nameInput, "María");
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(onUpdateProfile).toHaveBeenCalledWith({
      name: "María",
      birthDate: "1990-06-01",
      emergencyFundTargetMonths: 3,
    });
    expect(await screen.findByText("Perfil guardado.")).toBeInTheDocument();
  });

  it("muestra el error si falla el guardado", async () => {
    const user = userEvent.setup();
    const onUpdateProfile = vi.fn().mockRejectedValue(new Error("La fecha de nacimiento no puede ser futura"));
    render(<ProfileScreen profile={baseProfile()} onUpdateProfile={onUpdateProfile} />);

    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(await screen.findByText("La fecha de nacimiento no puede ser futura")).toBeInTheDocument();
  });
});
