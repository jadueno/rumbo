// Usa el mismo host desde el que se cargó la página (localhost, IP de LAN o
// de Tailscale) en vez de "localhost" fijo, que en el móvil apuntaría al
// propio móvil y no al Mac que sirve el backend.
export const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

// Solo se envía si el backend tiene API_TOKEN activado (ver backend/.env.example);
// vacío por defecto, así que el uso personal habitual no cambia.
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} en ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
