import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Sin este listener, un error en un cliente inactivo del pool (p. ej. Postgres
// reiniciándose) se propaga como 'error' no manejado en el proceso y lo tumba entero
// — encontrado de verdad: un reinicio del contenedor de Postgres se llevó por delante
// el backend real porque nada capturaba este evento.
pool.on("error", (err) => {
  console.error("Error inesperado en un cliente inactivo del pool de Postgres", err);
});
