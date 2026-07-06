import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// Safari < 17.4 no tiene Promise.withResolvers, que pdfjs-dist usa internamente.
const PromiseCtor = Promise as unknown as { withResolvers?: unknown };
if (typeof PromiseCtor.withResolvers !== "function") {
  PromiseCtor.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const LINE_Y_TOLERANCE = 2;

interface TextItem {
  str: string;
  transform: number[];
}

/**
 * pdf.js `page.getTextContent()` hace internamente `for await (const value of readableStream)`,
 * que requiere que ReadableStream soporte iteración asíncrona — no disponible en muchas versiones
 * de Safari/iOS. Se reimplementa aquí leyendo el mismo stream con `getReader()`/`read()`, que sí
 * es una API básica de ReadableStream soportada desde hace mucho más tiempo.
 */
async function getTextContentItems(page: pdfjsLib.PDFPageProxy): Promise<TextItem[]> {
  const reader = page.streamTextContent({}).getReader();
  const items: TextItem[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const item of value.items as TextItem[]) {
      if ("str" in item) items.push(item);
    }
  }
  return items;
}

/** Extrae el texto de un PDF reconstruyendo cada línea a partir de la posición de sus caracteres. */
export async function readPdfLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  // disableStream/disableAutoFetch/disableRange evitan la mensajería basada en ReadableStream
  // entre el hilo principal y el worker, que falla en algunas versiones de Safari/iOS; no hace
  // falta de todas formas porque ya tenemos el archivo completo en memoria.
  const pdf = await pdfjsLib.getDocument({
    data: buffer,
    disableStream: true,
    disableAutoFetch: true,
    disableRange: true,
  }).promise;

  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const items = await getTextContentItems(page);

    const rows: { y: number; x: number; str: string }[][] = [];
    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const x = item.transform[4];
      const row = rows.find((r) => Math.abs(r[0].y - y) <= LINE_Y_TOLERANCE);
      if (row) row.push({ y, x, str: item.str });
      else rows.push([{ y, x, str: item.str }]);
    }

    rows.sort((a, b) => b[0].y - a[0].y);
    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      lines.push(row.map((r) => r.str).join(" "));
    }
  }
  return lines;
}
