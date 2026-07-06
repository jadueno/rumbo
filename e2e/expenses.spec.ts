import { expect, test } from "@playwright/test";

test("crea una cuenta, añade un gasto y lo borra con confirmación", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ingresos y Gastos" }).click();

  await page.getByRole("button", { name: "+ Añadir cuenta" }).click();
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta E2E");
  await page.getByRole("button", { name: "Guardar cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Cuenta E2E" })).toBeVisible();

  await page.getByRole("button", { name: "+ Añadir gasto" }).click();
  await page.getByLabel("Concepto").fill("Gimnasio E2E");
  await page.getByLabel("Importe mensual (€)").fill("42");
  await page.getByRole("button", { name: "Guardar gasto" }).click();

  await expect(page.getByText("Gimnasio E2E")).toBeVisible();

  await page.getByRole("button", { name: "Eliminar gasto Gimnasio E2E" }).click();
  await expect(page.getByText('¿Eliminar el gasto "Gimnasio E2E"?')).toBeVisible();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();

  await expect(page.getByText("Gimnasio E2E")).not.toBeVisible();
});

test("cancelar la confirmación no borra el gasto", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ingresos y Gastos" }).click();

  await page.getByRole("button", { name: "+ Añadir cuenta" }).click();
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta E2E 2");
  await page.getByRole("button", { name: "Guardar cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Cuenta E2E 2" })).toBeVisible();

  await page.getByRole("button", { name: "+ Añadir gasto" }).click();
  await page.getByLabel("Concepto").fill("Suscripción E2E");
  await page.getByLabel("Importe mensual (€)").fill("15");
  await page.getByRole("button", { name: "Guardar gasto" }).click();
  await expect(page.getByText("Suscripción E2E")).toBeVisible();

  await page.getByRole("button", { name: "Eliminar gasto Suscripción E2E" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await expect(page.getByText("Suscripción E2E")).toBeVisible();
});
