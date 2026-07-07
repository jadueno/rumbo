import type { ExpenseItem } from "./types";

export interface RawMovement {
  date: Date | null;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
}

export interface ConceptGroup {
  key: string;
  label: string;
  category: string;
  subcategory: string;
  totalAbs: number;
  monthlyAverage: number;
  monthsSeen: number;
  occurrences: number;
}

export interface GroupedStatement {
  monthsInRange: number;
  totalExpenseMovements: number;
  groups: ConceptGroup[];
}

/** Un extracto puede traer movimientos de varias cuentas dentro del mismo archivo (p. ej. Bankinter). */
export interface StatementSection {
  sourceLabel: string;
  movements: RawMovement[];
}

const EXCLUDED_CATEGORY = "MOVIMIENTOS EXCLUIDOS";

// Prefijos habituales en descripciones de movimientos bancarios (ING y similares);
// se recortan para que quede solo el nombre del comercio/persona.
const DESCRIPTION_PREFIXES = [
  /^PAGO EN /,
  /^COMPRA EN /,
  /^COMPRA TARJETA EN /,
  /^RECIBO DOMICILIADO DE /,
  /^RECIBO DE /,
  /^BIZUM ENVIADO A /,
  /^BIZUM RECIBIDO DE /,
  /^TRANSFERENCIA RECIBIDA DE /,
  /^TRANSFERENCIA ENVIADA A /,
  /^TRASPASO RECIBIDO DE /,
  /^TRASPASO ENVIADO A /,
];

const COUNTRY_SUFFIXES = new Set(["ES", "PT", "FR", "DE", "IT", "NL", "GB", "IE", "US", "BE", "LU"]);

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(value: unknown): string {
  return stripAccents(String(value ?? "").toUpperCase()).trim();
}

/**
 * Limpia una descripción de movimiento para agrupar transacciones del mismo
 * comercio aunque el banco añada cada vez un código de operación distinto
 * (p. ej. "Pago en Spotify P441D5C972" en meses distintos).
 */
export function normalizeConcept(rawDescription: string): { key: string; label: string } {
  let text = stripAccents(rawDescription.toUpperCase()).trim();

  for (const prefix of DESCRIPTION_PREFIXES) {
    if (prefix.test(text)) {
      text = text.replace(prefix, "");
      break;
    }
  }

  text = text.replace(/[.*_/]/g, " ").replace(/\s+/g, " ").trim();

  let words = text.split(" ").filter(Boolean);
  if (words.length > 1 && COUNTRY_SUFFIXES.has(words[words.length - 1])) {
    words = words.slice(0, -1);
  }
  words = words.filter((word) => !(/\d/.test(word) && (word.length >= 4 || /^\d+$/.test(word))));

  const key = words.join(" ").trim() || text;
  const label = key
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

  return { key, label };
}

interface ColumnMap {
  date: number;
  category: number;
  subcategory: number;
  description: number;
  amount: number;
}

function findColumnMap(rows: unknown[][]): { headerIndex: number; columns: ColumnMap } | null {
  const searchLimit = Math.min(rows.length, 15);
  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    if (!row) continue;
    const headers = row.map(normalizeHeader);
    const amountIdx = headers.findIndex((h) => h.includes("IMPORTE"));
    // Si el extracto trae "Concepto" (tipo genérico de movimiento, p. ej. "RECIBO") y
    // "Descripción" (el comercio real) a la vez —como Ibercaja—, se prioriza Descripción:
    // agrupar por el comercio concreto es lo útil aquí, no por el tipo de movimiento.
    const descripIdx = headers.findIndex((h) => h.includes("DESCRIP"));
    const conceptoIdx = headers.findIndex((h) => h.includes("CONCEPTO"));
    const descriptionIdx = descripIdx !== -1 ? descripIdx : conceptoIdx;
    if (amountIdx === -1 || descriptionIdx === -1) continue;

    return {
      headerIndex: i,
      columns: {
        amount: amountIdx,
        description: descriptionIdx,
        subcategory: headers.findIndex((h) => h.includes("SUBCATEGOR")),
        category: headers.findIndex((h) => h.includes("CATEGOR") && !h.includes("SUBCATEGOR")),
        date: headers.findIndex((h) => h.includes("FECHA") || h.includes("F VALOR") || h.includes("F. VALOR")),
      },
    };
  }
  return null;
}

/** Convierte las filas crudas de un extracto (hoja leída como array de arrays) en movimientos tipados. */
export function parseMovementRows(rows: unknown[][]): RawMovement[] {
  const found = findColumnMap(rows);
  if (!found) return [];
  const { headerIndex, columns } = found;

  const movements: RawMovement[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const amountRaw = row[columns.amount];
    const amount = typeof amountRaw === "number" ? amountRaw : parseFloat(String(amountRaw ?? "").replace(",", "."));
    if (Number.isNaN(amount)) continue;

    const description = String(row[columns.description] ?? "").trim();
    if (!description) continue;

    const dateRaw = columns.date >= 0 ? row[columns.date] : undefined;
    const date = dateRaw instanceof Date ? dateRaw : typeof dateRaw === "string" ? new Date(dateRaw) : null;

    movements.push({
      date: date && !Number.isNaN(date.getTime()) ? date : null,
      category: columns.category >= 0 ? String(row[columns.category] ?? "").trim() : "",
      subcategory: columns.subcategory >= 0 ? String(row[columns.subcategory] ?? "").trim() : "",
      description,
      amount,
    });
  }
  return movements;
}

function findAccountNumberLabel(rows: unknown[][]): string | null {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i];
    if (!row) continue;
    for (let c = 0; c < row.length - 1; c++) {
      if (normalizeHeader(row[c]).includes("NUMERO DE CUENTA")) {
        const value = String(row[c + 1] ?? "").trim();
        if (value) return `Cuenta ${value}`;
      }
    }
  }
  return null;
}

/** Envuelve un extracto en formato hoja de cálculo (.xls/.xlsx/.csv) como una única sección. */
export function parseSpreadsheetRows(rows: unknown[][]): StatementSection[] {
  const movements = parseMovementRows(rows);
  if (movements.length === 0) return [];
  return [{ sourceLabel: findAccountNumberLabel(rows) ?? "Extracto importado", movements }];
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Agrupa movimientos de gasto por concepto normalizado y calcula su media mensual. */
export function groupMovements(movements: RawMovement[]): GroupedStatement {
  const dated = movements.filter((m): m is RawMovement & { date: Date } => m.date !== null);
  const times = dated.map((m) => m.date.getTime());
  const monthsInRange =
    times.length > 0
      ? (() => {
          const from = new Date(Math.min(...times));
          const to = new Date(Math.max(...times));
          return (to.getFullYear() * 12 + to.getMonth()) - (from.getFullYear() * 12 + from.getMonth()) + 1;
        })()
      : 1;

  const expenseMovements = movements.filter(
    (m) => m.amount < 0 && normalizeHeader(m.category) !== EXCLUDED_CATEGORY,
  );

  const byKey = new Map<
    string,
    { label: string; category: string; subcategory: string; total: number; months: Set<string>; occurrences: number }
  >();

  for (const m of expenseMovements) {
    const { key, label } = normalizeConcept(m.description);
    const monthLabel = m.date ? monthKey(m.date) : "sin-fecha";
    const existing = byKey.get(key);
    if (existing) {
      existing.total += Math.abs(m.amount);
      existing.months.add(monthLabel);
      existing.occurrences += 1;
    } else {
      byKey.set(key, {
        label,
        category: m.category,
        subcategory: m.subcategory,
        total: Math.abs(m.amount),
        months: new Set([monthLabel]),
        occurrences: 1,
      });
    }
  }

  const groups: ConceptGroup[] = Array.from(byKey.entries()).map(([key, v]) => ({
    key,
    label: v.label,
    category: v.category,
    subcategory: v.subcategory,
    totalAbs: Math.round(v.total * 100) / 100,
    monthlyAverage: Math.round((v.total / monthsInRange) * 100) / 100,
    monthsSeen: v.months.size,
    occurrences: v.occurrences,
  }));

  groups.sort((a, b) => b.monthlyAverage - a.monthlyAverage);

  return { monthsInRange, totalExpenseMovements: expenseMovements.length, groups };
}

const SECTION_HEADER_RE = /Movimientos de su Cuenta\s*N[ºo°]?:?\s*([\d.]+)/i;
const OPENING_BALANCE_RE = /SALDO ANTERIOR EN EUR\s+([\d.,]+)/i;
const MOVEMENT_LINE_RE = /^(\d{2}-\d{2}-\d{2})\s+(\S+)\s+(\d{2}-\d{2}-\d{2})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s*$/;
const HOLDER_SURNAME_RE = /Estimado\s+(?:Sr|Sra)\.?\s+([A-ZÑÁÉÍÓÚÜ]+)/;

function parseSpanishAmount(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function parseShortDate(value: string): Date | null {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yy] = match;
  const year = Number(yy) + (Number(yy) < 70 ? 2000 : 1900);
  const date = new Date(year, Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Los extractos de Bankinter no traen categoría propia y mezclan traspasos entre tus
 * propias cuentas con gastos reales (p. ej. "TRANS /Juan Antonio Madueño Ga" o
 * "TRANSF INTE /Cuenta Corriente."). Se marcan como excluidos igual que ING hace con sus
 * "Movimientos excluidos", usando el apellido del titular (extraído del propio PDF) para
 * detectar traspasos a nombre propio sin depender de datos hardcodeados.
 */
function isInternalTransfer(description: string, holderSurname: string | null): boolean {
  const normalized = stripAccents(description.toUpperCase());
  if (/^TRANSF?\s*INTE/.test(normalized)) return true;
  if (holderSurname && /^TRANS/.test(normalized) && normalized.includes(holderSurname)) return true;
  return false;
}

/** Extrae los movimientos de un extracto integral de Bankinter (PDF), que puede traer varias cuentas. */
export function parseBankinterPdfLines(lines: string[]): StatementSection[] {
  const holderMatch = lines.join("\n").match(HOLDER_SURNAME_RE);
  const holderSurname = holderMatch ? stripAccents(holderMatch[1].toUpperCase()) : null;

  const sections: StatementSection[] = [];
  let current: StatementSection | null = null;
  let runningBalance: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = line.match(SECTION_HEADER_RE);
    if (sectionMatch) {
      if (current && current.movements.length > 0) sections.push(current);
      current = { sourceLabel: `Cuenta nº ${sectionMatch[1]}`, movements: [] };
      runningBalance = null;
      continue;
    }
    if (!current) continue;

    const openingMatch = line.match(OPENING_BALANCE_RE);
    if (openingMatch) {
      runningBalance = parseSpanishAmount(openingMatch[1]);
      continue;
    }

    const moveMatch = line.match(MOVEMENT_LINE_RE);
    if (moveMatch && runningBalance !== null) {
      const [, fecha, , , description, , saldoStr] = moveMatch;
      const newBalance = parseSpanishAmount(saldoStr);
      const amount = Math.round((newBalance - runningBalance) * 100) / 100;
      runningBalance = newBalance;
      const trimmedDescription = description.trim();
      current.movements.push({
        date: parseShortDate(fecha),
        category: isInternalTransfer(trimmedDescription, holderSurname) ? "Movimientos excluidos" : "",
        subcategory: "",
        description: trimmedDescription,
        amount,
      });
    }
  }
  if (current && current.movements.length > 0) sections.push(current);
  return sections;
}

const BBVA_EMISSION_DATE_RE = /Fecha de emisi[oó]n:\s*(\d{2})\/(\d{2})\/(\d{4})/i;
const BBVA_IBAN_RE = /IBAN\s+([A-Z]{2}\d{2}(?:\s+\d{4}){5})/i;
const BBVA_MOVEMENT_LINE_RE = /^(\d{2})\/(\d{2})\s+\d{2}\/\d{2}\s+(.+?)\s+(-?[\d.]+,\d{2})\s+[\d.]+,\d{2}\s*$/;

/**
 * BBVA no expone el año en cada movimiento (solo DD/MM), así que se toma del encabezado
 * "Fecha de emisión". Un extracto mensual puede arrastrar algún movimiento de finales del
 * mes anterior (p. ej. emitido en enero con movimientos de diciembre): si el mes del
 * movimiento es posterior al de emisión, se asume que pertenece al año anterior.
 */
function parseBbvaDate(day: string, month: string, referenceYear: number, referenceMonth: number): Date {
  const monthNum = Number(month);
  const year = monthNum > referenceMonth ? referenceYear - 1 : referenceYear;
  return new Date(year, monthNum - 1, Number(day));
}

/**
 * La línea de detalle bajo cada movimiento trae un prefijo de referencia (nº de tarjeta de
 * 16 dígitos, o una referencia "N ...") antes del comercio o concepto real, p. ej.
 * "4188202167224417 Google One" o "N 2026147002672560 TGSS. COTIZACION 005 R.E.AUTONOMOS".
 */
function stripBbvaReference(text: string): string {
  return text.replace(/^\d{10,}\s+/, "").replace(/^N\s+\d+\s+/i, "").trim();
}

/**
 * Extrae los movimientos de un "Extracto mensual de cuentas personales" de BBVA (PDF).
 * A diferencia de Bankinter, cada línea de movimiento ya trae su propio importe (no hay que
 * derivarlo de la diferencia de saldo) y el detalle del comercio va en la línea siguiente, sin
 * fecha ni importe — se usa como descripción cuando está presente y si no, el concepto genérico
 * de la propia línea de movimiento (p. ej. "TRANSFERENCIAS").
 */
export function parseBbvaPdfLines(lines: string[]): StatementSection[] {
  const joined = lines.join("\n");
  const emissionMatch = joined.match(BBVA_EMISSION_DATE_RE);
  if (!emissionMatch) return [];
  const [, , emissionMonth, emissionYear] = emissionMatch;
  const referenceMonth = Number(emissionMonth);
  const referenceYear = Number(emissionYear);

  const ibanMatch = joined.match(BBVA_IBAN_RE);
  const sourceLabel = ibanMatch ? `Cuenta ${ibanMatch[1].replace(/\s+/g, " ")}` : "Extracto BBVA";

  const movements: RawMovement[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(BBVA_MOVEMENT_LINE_RE);
    if (!match) continue;

    const [, day, month, conceptTitle, importeStr] = match;
    const nextLine = lines[i + 1]?.trim();
    const isDetailLine = !!nextLine && !BBVA_MOVEMENT_LINE_RE.test(nextLine) && !/^SALDO/i.test(nextLine);

    movements.push({
      date: parseBbvaDate(day, month, referenceYear, referenceMonth),
      category: "",
      subcategory: "",
      description: isDetailLine ? stripBbvaReference(nextLine) : conceptTitle.trim(),
      amount: parseSpanishAmount(importeStr),
    });
  }

  return movements.length > 0 ? [{ sourceLabel, movements }] : [];
}

/** Busca si un concepto detectado en el extracto ya corresponde a un gasto apuntado en la app. */
export function matchExistingExpense(concept: ConceptGroup, expenses: ExpenseItem[]): ExpenseItem | null {
  for (const expense of expenses) {
    const { key: expenseKey } = normalizeConcept(expense.label);
    if (!expenseKey) continue;
    if (expenseKey === concept.key || concept.key.includes(expenseKey) || expenseKey.includes(concept.key)) {
      return expense;
    }
  }
  return null;
}
