import { expect, test } from "@playwright/test";

test("un ingreso nuevo se refleja en el resumen sin recargar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ingresos y Gastos" }).click();

  await page.getByRole("button", { name: "+ Añadir cuenta" }).click();
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta E2E Ingresos");
  await page.getByRole("button", { name: "Guardar cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Cuenta E2E Ingresos" })).toBeVisible();

  await page.getByRole("button", { name: "+ Añadir ingreso" }).click();
  await page.getByLabel("Concepto").fill("Nómina E2E");
  await page.getByLabel("Importe mensual (€)").fill("1500");
  await page.getByRole("button", { name: "Guardar ingreso" }).click();

  await expect(page.getByText("Nómina E2E").first()).toBeVisible();

  await page.getByRole("button", { name: "Resumen" }).click();
  await expect(page.getByText(/1500|1\.500/)).toBeVisible();
});
