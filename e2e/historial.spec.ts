import { expect, test } from "@playwright/test";

test("guarda el snapshot del mes y lo ve reflejado en el resumen y la tabla", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Historial" }).click();

  await expect(page.getByRole("button", { name: "+ Guardar snapshot de este mes" })).toBeVisible();
  await page.getByRole("button", { name: "+ Guardar snapshot de este mes" }).click();

  await expect(page.getByRole("button", { name: "Actualizar snapshot de este mes" })).toBeVisible();
  await expect(page.getByText(/ya guardado, puedes actualizarlo con los números de hoy/)).toBeVisible();

  await expect(page.getByText(/guarda al menos un mes más para ver la evolución/).first()).toBeVisible();

  const table = page.getByRole("table");
  await expect(table.getByRole("button", { name: /Eliminar snapshot de/ })).toHaveCount(1);
});
