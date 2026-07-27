import "dotenv/config";
import { pool } from "./infrastructure/db/pool.js";
import { buildServer } from "./infrastructure/http/server.js";

const port = Number(process.env.PORT ?? 3001);

// Login opcional: las tres variables juntas o ninguna (ver .env.example) — sin ellas el
// uso personal local/Tailscale sigue sin fricción, exactamente igual que el token fijo
// que sustituye.
const loginConfig =
  process.env.LOGIN_USERNAME && process.env.LOGIN_PASSWORD_HASH && process.env.SESSION_SECRET
    ? {
        username: process.env.LOGIN_USERNAME,
        passwordHash: process.env.LOGIN_PASSWORD_HASH,
        sessionSecret: process.env.SESSION_SECRET,
      }
    : undefined;

async function main() {
  const app = await buildServer(pool, { loginConfig });
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
