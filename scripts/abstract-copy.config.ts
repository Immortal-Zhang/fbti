import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Explicit local editorial proofs, never part of ordinary application/test output. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  test: { environment: "node", include: ["scripts/generate-abstract-samples.ts", "scripts/render-copy-proofs.ts"] },
});
