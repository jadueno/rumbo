import { expect, test } from "@playwright/test";

test("un ingreso nuevo se refleja en el resumen sin recargar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Resumen" }).click();
  // Comparamos el contenido de Resumen antes/después (no una cifra concreta): Resumen es
  // deliberadamente resumido y no muestra el importe en bruto de cada ingreso, así que lo
  // que hay que probar es que se recalcula solo tras el alta, sin recargar la página.
  const resumenBefore = await page.locator("main").innerText();

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
  const resumenAfter = await page.locator("main").innerText();
  expect(resumenAfter).not.toBe(resumenBefore);
});
