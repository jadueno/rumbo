import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// jsdom no implementa DOMMatrix (API de Canvas). pdfjs-dist lo referencia al cargar el
// módulo aunque no rendericemos ningún PDF en los tests de componentes; basta con que exista.
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-expect-error stub mínimo, solo para que pdfjs-dist pueda cargarse bajo jsdom
  globalThis.DOMMatrix = class DOMMatrix {};
}
