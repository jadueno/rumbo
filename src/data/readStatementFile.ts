import * as XLSX from "xlsx";
import type { StatementSection } from "../domain/statementImport";
import { parseBankinterPdfLines, parseBbvaPdfLines, parseSpreadsheetRows } from "../domain/statementImport";
import { readPdfLines } from "./readPdfStatement";

/** Lee un extracto bancario (.xls, .xlsx o .csv) y devuelve sus filas como array de arrays. */
async function readStatementRows(file: File): Promise<unknown[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];
}

/** Lee cualquier formato de extracto soportado (.xls, .xlsx, .csv o .pdf) y lo separa en secciones por cuenta. */
export async function readStatementSections(file: File): Promise<StatementSection[]> {
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const lines = await readPdfLines(file);
    // No hay forma fiable de saber a qué banco pertenece un PDF sin intentar parsearlo: se
    // prueba cada formato reconocido hasta que uno reconozca movimientos.
    const bankinterSections = parseBankinterPdfLines(lines);
    if (bankinterSections.length > 0) return bankinterSections;
    return parseBbvaPdfLines(lines);
  }
  const rows = await readStatementRows(file);
  return parseSpreadsheetRows(rows);
}
