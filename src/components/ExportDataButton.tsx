import { useState } from "react";
import { downloadDataExport } from "../data/api";
import { Button } from "./Button";
import { DownloadIcon } from "./icons";

/** Botón para descargar un backup en JSON de todos los datos financieros reales. */
export function ExportDataButton() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const handleClick = async () => {
    setState("loading");
    try {
      await downloadDataExport();
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={state === "loading"}
        aria-label="Exportar mis datos"
      >
        <DownloadIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">{state === "loading" ? "Exportando…" : "Exportar datos"}</span>
      </Button>
      {state === "error" && (
        <span className="text-xs font-medium text-[var(--status-critical)]">No se pudo exportar</span>
      )}
    </div>
  );
}
