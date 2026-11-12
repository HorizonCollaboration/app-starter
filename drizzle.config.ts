import { defineConfig } from "drizzle-kit";

// Fixed by Horizon: `npm run db:generate` writes a migration for each schema change.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
