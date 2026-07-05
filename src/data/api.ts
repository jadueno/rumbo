// Usa el mismo host desde el que se cargó la página (localhost, IP de LAN o
// de Tailscale) en vez de "localhost" fijo, que en el móvil apuntaría al
// propio móvil y no al Mac que sirve el backend.
export const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} en ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Descarga un JSON con todos los datos financieros reales guardados en la base de datos. */
export async function downloadDataExport(): Promise<void> {
  const data = await request<unknown>("/export");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rumbo-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
