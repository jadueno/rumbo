import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_FIXTURE = path.join(__dirname, "fixtures", "extracto-ejemplo.csv");

test("importa un extracto, detecta un gasto recurrente no apuntado y lo añade con un click", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ingresos y Gastos" }).click();

  await page.getByRole("button", { name: "+ Añadir cuenta" }).click();
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta Import E2E");
  await page.getByRole("button", { name: "Guardar cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Cuenta Import E2E" })).toBeVisible();

  await page.getByRole("button", { name: "Importar movimientos" }).click();
  const dialog = page.getByRole("dialog", { name: "Importar movimientos bancarios" });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Archivo(s) (.xls, .xlsx, .csv o .pdf)").setInputFiles(CSV_FIXTURE);

  // El desplegable "Asignar a" apunta por defecto a la primera cuenta existente en toda
  // la app (no necesariamente la que acabamos de crear), así que la fijamos explícitamente.
  await dialog.getByRole("combobox").first().selectOption("Cuenta Import E2E");

  await expect(dialog.getByText(/No tienes esto apuntado/)).toBeVisible();
  const untrackedRow = dialog.locator("li").filter({ hasText: /Netflix/i });
  await untrackedRow.getByRole("button", { name: "+ Añadir" }).click();

  // Al añadirlo, el gasto recién creado hace que el propio concepto se reclasifique
  // como "ya apuntado" (se compara consigo mismo), así que en vez de esperar el aviso
  // transitorio "Añadido ✓" comprobamos el resultado real: aparece en "Ya los tienes
  // apuntados" y, tras cerrar el modal, en la cuenta correspondiente de la pantalla principal.
  await expect(dialog.getByText(/Ya los tienes apuntados/)).toBeVisible();
  await expect(dialog.locator("li").filter({ hasText: /Netflix/i })).toBeVisible();

  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await expect(dialog).not.toBeVisible();

  await expect(page.getByRole("button", { name: /Eliminar gasto Netflix/i })).toBeVisible();
});
