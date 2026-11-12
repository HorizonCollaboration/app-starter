// Fixed by Horizon: Laravel Cloud runs this before each new version goes live.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL isn't set, so there's no database to update.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("The database is up to date.");
} finally {
  await client.end();
}
