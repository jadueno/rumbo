import { clearStoredToken, getStoredToken, notifyUnauthorized, setStoredToken } from "./auth";

// Usa el mismo host desde el que se cargó la página (localhost, IP de LAN o
// de Tailscale) en vez de "localhost" fijo, que en el móvil apuntaría al
// propio móvil y no al Mac que sirve el backend.
export const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // /login ya reporta sus propios 401 (contraseña incorrecta) como error normal del
  // formulario — no es una sesión que haya caducado, así que no debe reenviar a la
  // pantalla de login (en la que ya estamos).
  if (res.status === 401 && path !== "/login") {
    notifyUnauthorized();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} en ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** `loginRequired: false` si el backend no tiene login configurado (uso personal local,
 * ver backend/.env.example) — la app entera sigue sin fricción en ese caso. */
export function getAuthConfig<T = { loginRequired: boolean }>(): Promise<T> {
  return request("/auth-config");
}

export async function login(username: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(token);
}

export function logout(): void {
  clearStoredToken();
}

/** Cliente CRUD genérico para un recurso REST estándar (GET/POST/PUT/DELETE). */
export function createCrudClient<T, TNew>(path: string) {
  return {
    list: () => request<T[]>(path),
    create: (entity: TNew) => request<T>(path, { method: "POST", body: JSON.stringify(entity) }),
    update: (id: string, entity: TNew) =>
      request<T>(`${path}/${id}`, { method: "PUT", body: JSON.stringify(entity) }),
    remove: (id: string) => request<void>(`${path}/${id}`, { method: "DELETE" }),
  };
}

/** Cliente para un recurso singleton sin id (GET/PUT), como /profile. */
export function createSingletonClient<T>(path: string) {
  return {
    get: () => request<T>(path),
    update: (entity: T) => request<T>(path, { method: "PUT", body: JSON.stringify(entity) }),
  };
}

export interface BackupResult {
  file: string;
  sizeBytes: number;
  at: string;
}

/** Dispara una copia de seguridad bajo demanda (mismo pg_dump que el cron diario). */
export function triggerBackup(): Promise<BackupResult> {
  return request<BackupResult>("/backup", { method: "POST" });
}
