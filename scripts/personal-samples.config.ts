import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Explicit authoring command only; the ordinary test suite never writes artifacts. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  test: { environment: "node", include: ["scripts/generate-personal-samples.ts"] },
});
