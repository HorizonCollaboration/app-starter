import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Fixed by Horizon: don't change this file.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
});
