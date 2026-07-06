import { describe, expect, it } from "vitest";
import type { ExpenseItem } from "./types";
import {
  groupMovements,
  matchExistingExpense,
  normalizeConcept,
  parseBankinterPdfLines,
  parseMovementRows,
  parseSpreadsheetRows,
  type RawMovement,
} from "./statementImport";

describe("normalizeConcept", () => {
  it("recorta el prefijo habitual y deja el nombre del comercio", () => {
    expect(normalizeConcept("Pago en MACDONALDS PALENCIA PALENCIA ES")).toEqual({
      key: "MACDONALDS PALENCIA PALENCIA",
      label: "Macdonalds Palencia Palencia",
    });
  });

  it("agrupa el mismo comercio aunque cambie el código de operación", () => {
    const a = normalizeConcept("Pago en Spotify P441D5C972");
    const b = normalizeConcept("Pago en Spotify Q998Z1A234");
    expect(a.key).toBe(b.key);
    expect(a.key).toBe("SPOTIFY");
  });

  it("quita un sufijo de país final conocido", () => {
    expect(normalizeConcept("Pago en CAFETERIA HAPPY PALENCIA ES").key).toBe("CAFETERIA HAPPY PALENCIA");
  });

  it("no rompe con una descripción vacía o solo prefijo", () => {
    expect(normalizeConcept("").key).toBe("");
  });

  it("ignora acentos y mayúsculas al comparar dos descripciones equivalentes", () => {
    expect(normalizeConcept("Pago en Dia Retail España").key).toBe(normalizeConcept("PAGO EN DIA RETAIL ESPANA").key);
  });
});

describe("parseMovementRows", () => {
  const header = ["F. VALOR", "CATEGORÍA", "SUBCATEGORÍA", "DESCRIPCIÓN", "COMENTARIO", "IMPORTE (€)", "SALDO (€)"];

  it("encuentra la cabecera y parsea filas con fecha, importe (coma decimal) y descripción", () => {
    const rows = [
      ["Movimientos de la Cuenta"],
      [],
      [],
      header,
      [new Date(2026, 5, 4), "Ocio y viajes", "Restaurantes", "Pago en MACDONALDS", "", -14.99, 1014.01],
    ];
    const movements = parseMovementRows(rows);
    expect(movements).toEqual([
      {
        date: new Date(2026, 5, 4),
        category: "Ocio y viajes",
        subcategory: "Restaurantes",
        description: "Pago en MACDONALDS",
        amount: -14.99,
      },
    ]);
  });

  it("parsea un importe con coma decimal cuando viene como texto", () => {
    const rows = [header, [new Date(2026, 5, 4), "", "", "Pago en X", "", "-1,98", 100]];
    expect(parseMovementRows(rows)[0].amount).toBe(-1.98);
  });

  it("ignora filas sin descripción o con un importe no numérico", () => {
    const rows = [
      header,
      [new Date(2026, 5, 4), "", "", "", "", -5, 100],
      [new Date(2026, 5, 4), "", "", "Concepto válido", "", "no-numero", 100],
    ];
    expect(parseMovementRows(rows)).toEqual([]);
  });

  it("devuelve [] si no reconoce ninguna cabecera con IMPORTE y DESCRIPCIÓN", () => {
    expect(parseMovementRows([["a", "b"], ["c", "d"]])).toEqual([]);
  });
});

describe("parseSpreadsheetRows", () => {
  const header = ["F. VALOR", "CATEGORÍA", "SUBCATEGORÍA", "DESCRIPCIÓN", "COMENTARIO", "IMPORTE (€)", "SALDO (€)"];

  it("usa el número de cuenta como sourceLabel si lo encuentra en la cabecera", () => {
    const rows = [
      ["Movimientos de la Cuenta", "", "  Número de cuenta:", "1465 0100 9617 43283824"],
      header,
      [new Date(2026, 5, 4), "", "", "Pago en X", "", -5, 100],
    ];
    const sections = parseSpreadsheetRows(rows);
    expect(sections).toHaveLength(1);
    expect(sections[0].sourceLabel).toBe("Cuenta 1465 0100 9617 43283824");
    expect(sections[0].movements).toHaveLength(1);
  });

  it("usa una etiqueta genérica si no encuentra el número de cuenta", () => {
    const rows = [header, [new Date(2026, 5, 4), "", "", "Pago en X", "", -5, 100]];
    expect(parseSpreadsheetRows(rows)[0].sourceLabel).toBe("Extracto importado");
  });

  it("devuelve [] si no hay movimientos", () => {
    expect(parseSpreadsheetRows([header])).toEqual([]);
  });
});

describe("groupMovements", () => {
  function movement(overrides: Partial<RawMovement>): RawMovement {
    return { date: new Date(2026, 5, 1), category: "", subcategory: "", description: "X", amount: -10, ...overrides };
  }

  it("agrupa movimientos del mismo concepto y sube el total", () => {
    const result = groupMovements([
      movement({ description: "Pago en Spotify P441D5C972", amount: -11.99, date: new Date(2026, 4, 3) }),
      movement({ description: "Pago en Spotify Q998Z1A234", amount: -11.99, date: new Date(2026, 5, 3) }),
    ]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].totalAbs).toBeCloseTo(23.98);
    expect(result.groups[0].monthsSeen).toBe(2);
    expect(result.groups[0].occurrences).toBe(2);
  });

  it("excluye la categoría MOVIMIENTOS EXCLUIDOS y los importes positivos", () => {
    const result = groupMovements([
      movement({ description: "Traspaso propio", amount: -100, category: "Movimientos excluidos" }),
      movement({ description: "Nómina", amount: 2000 }),
      movement({ description: "Gasto real", amount: -50 }),
    ]);
    expect(result.groups.map((g) => g.label)).toEqual(["Gasto Real"]);
    expect(result.totalExpenseMovements).toBe(1);
  });

  it("calcula la media mensual dividiendo entre los meses que abarca el extracto", () => {
    const result = groupMovements([
      movement({ description: "Alquiler", amount: -300, date: new Date(2026, 0, 1) }),
      movement({ description: "Alquiler", amount: -300, date: new Date(2026, 2, 1) }),
    ]);
    // enero a marzo = 3 meses de rango, 600€ totales → 200€/mes
    expect(result.monthsInRange).toBe(3);
    expect(result.groups[0].monthlyAverage).toBe(200);
  });

  it("ordena los grupos por media mensual descendente", () => {
    const result = groupMovements([
      movement({ description: "Pequeño", amount: -5 }),
      movement({ description: "Grande", amount: -500 }),
    ]);
    // el label sale sin acentos: normalizeConcept trabaja sobre el texto ya des-acentuado
    expect(result.groups.map((g) => g.label)).toEqual(["Grande", "Pequeno"]);
  });

  it("con un solo movimiento sin fecha usa un mes de rango", () => {
    const result = groupMovements([movement({ date: null, amount: -100 })]);
    expect(result.monthsInRange).toBe(1);
    expect(result.groups[0].monthlyAverage).toBe(100);
  });
});

describe("parseBankinterPdfLines", () => {
  const sampleLines = [
    "Estimado Sr. MADUEÑO:",
    "Movimientos de su Cuenta Nº: 0128.0799.39.0100063454 en EUR",
    "SALDO ANTERIOR EN EUR 4.305,38",
    "04-05-26 519 04-05-26 RECIBO /C.P. TERRAZAS DEL SOL 49,33 4.256,05",
    "04-05-26 025 04-05-26 TRANS /Juan Antonio Madueño Ga 800,00 3.456,05",
    "04-05-26 024 04-05-26 TRANSF INTE /Cuenta Corriente. 300,00 3.156,05",
    "28-05-26 93 28-05-26 TRANSF NOMIN /ALTEN SOLUCIONES 3.946,31 7.102,36",
    "SALDO FINAL EN EUR 7.102,36",
    "Movimientos de su Cuenta Nº: 0128.0799.32.0100063461 en EUR",
    "SALDO ANTERIOR EN EUR 129,03",
    "04-05-26 130 01-05-26 MERCADONA EL TERCER BARRI 61,86 67,17",
    "SALDO FINAL EN EUR 67,17",
  ];

  it("detecta una sección por cada cuenta del extracto", () => {
    const sections = parseBankinterPdfLines(sampleLines);
    expect(sections.map((s) => s.sourceLabel)).toEqual([
      "Cuenta nº 0128.0799.39.0100063454",
      "Cuenta nº 0128.0799.32.0100063461",
    ]);
  });

  it("calcula el importe de cada movimiento por diferencia de saldo, no por el número de la línea", () => {
    const [first] = parseBankinterPdfLines(sampleLines);
    const recibo = first.movements.find((m) => m.description.includes("TERRAZAS"));
    expect(recibo?.amount).toBeCloseTo(-49.33);
  });

  it("excluye traspasos a nombre del propio titular y traspasos internos, pero no otros abonos/cargos", () => {
    const [first] = parseBankinterPdfLines(sampleLines);
    const byDescription = Object.fromEntries(first.movements.map((m) => [m.description, m.category]));
    expect(byDescription["TRANS /Juan Antonio Madueño Ga"]).toBe("Movimientos excluidos");
    expect(byDescription["TRANSF INTE /Cuenta Corriente."]).toBe("Movimientos excluidos");
    expect(byDescription["TRANSF NOMIN /ALTEN SOLUCIONES"]).toBe("");
    expect(byDescription["RECIBO /C.P. TERRAZAS DEL SOL"]).toBe("");
  });

  it("devuelve [] si no reconoce ninguna sección", () => {
    expect(parseBankinterPdfLines(["texto suelto sin ninguna cabecera reconocible"])).toEqual([]);
  });
});

describe("matchExistingExpense", () => {
  function expense(overrides: Partial<ExpenseItem>): ExpenseItem {
    return { id: "1", group: "Variables", account: "ING", label: "Spotify", monthlyAmount: 12, ...overrides };
  }

  it("encuentra un gasto ya apuntado con la misma clave normalizada", () => {
    const concept = normalizeConcept("Pago en Spotify P441D5C972");
    const match = matchExistingExpense(
      { key: concept.key, label: concept.label, category: "", subcategory: "", totalAbs: 12, monthlyAverage: 12, monthsSeen: 1, occurrences: 1 },
      [expense({ label: "Spotify" })],
    );
    expect(match?.label).toBe("Spotify");
  });

  it("no encuentra coincidencia si no hay ningún gasto apuntado parecido", () => {
    const concept = normalizeConcept("Pago en Mercadona");
    const match = matchExistingExpense(
      { key: concept.key, label: concept.label, category: "", subcategory: "", totalAbs: 12, monthlyAverage: 12, monthsSeen: 1, occurrences: 1 },
      [expense({ label: "Spotify" })],
    );
    expect(match).toBeNull();
  });
});
