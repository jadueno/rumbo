import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../scripts/backup-db.sh");

export interface BackupResult {
  file: string;
  sizeBytes: number;
}

/**
 * Backup bajo demanda, reutilizando el mismo script que ya usa el cron diario
 * (scripts/backup-db.sh vía launchd): mismo pg_dump dentro del contenedor, mismo
 * formato, misma carpeta y misma retención — un único sitio que sabe cómo se
 * hace un backup de Rumbo, en vez de reimplementarlo por segunda vez aquí.
 */
export async function runBackup(): Promise<BackupResult> {
  const { stdout } = await execFileAsync(SCRIPT_PATH, [], { timeout: 60_000 });
  const match = stdout.match(/Backup OK: (\S+\.dump\.gz)/);
  if (!match) {
    throw new Error(`El script de backup no confirmó haber creado el fichero. Salida:\n${stdout}`);
  }
  const file = match[1];
  const { size } = await stat(file);
  return { file, sizeBytes: size };
}
