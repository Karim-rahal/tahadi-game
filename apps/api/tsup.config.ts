import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle the workspace shared package (it ships TS source, not a build).
  noExternal: ["@darundi/shared"],
  // Keep node_modules external; @prisma/client must stay external so its
  // generated engine/runtime resolve correctly at runtime.
  external: ["@prisma/client"],
});
