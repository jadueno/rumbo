import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ConfirmFn = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((msg) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setMessage(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {message && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-message"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onKeyDown={(e) => e.key === "Escape" && close(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-lg">
            <p id="confirm-dialog-message" className="text-sm text-[var(--text-primary)]">
              {message}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => close(false)}
                className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--gridline)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--status-critical)" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
