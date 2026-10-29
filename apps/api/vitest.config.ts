import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests that need a real DATABASE_URL opt in via this env flag.
    passWithNoTests: false,
  },
});
