import { useState } from "react";
import { Button } from "../../components/Button";
import { Field, inputClass } from "../../components/Field";
import { BrandMark } from "../../components/BrandMark";

/** Pantalla completa, sin nav ni contenido detrás — se muestra en vez de toda la app
 * (ver App.tsx) mientras no haya una sesión válida, no como un modal superpuesto: no
 * tiene sentido dejar entrever datos financieros reales detrás de un formulario de login. */
export function LoginScreen({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-[1.75rem] border border-[var(--border)] p-8 shadow-float"
        style={{ backgroundColor: "color-mix(in srgb, var(--surface-1) 92%, transparent)" }}
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandMark size="md" />
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Rumbo</h1>
          <p className="text-sm text-[var(--text-secondary)]">Inicia sesión para ver tu economía</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Usuario">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-[var(--status-critical)]">
              {error}
            </p>
          )}
          <Button type="submit" tone="ink" disabled={loading} className="w-full">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
