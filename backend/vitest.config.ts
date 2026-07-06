import { defineConfig } from "vitest/config";

// Config propia para que vitest no suba a buscar (y herede por error) el
// vite.config.ts del frontend cuando se corre desde backend/.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
