import { defineConfig } from "drizzle-kit";

// Fixed by Horizon: `npm run db:generate` writes a migration for each schema change.
export default defineConfig({
  dialect: "postgresql",
  // Every table is in one of these; schema.ts shares `user` from the first.
  schema: ["./src/db/auth-schema.ts", "./src/db/schema.ts"],
  out: "./drizzle",
});
