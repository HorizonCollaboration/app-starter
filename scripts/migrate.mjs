// Fixed by Horizon: Laravel Cloud runs this before each new version goes live.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL isn't set, so there's no database to update.");
  process.exit(1);
}

const url = process.env.DATABASE_URL;

// Laravel Cloud's databases only accept encrypted connections; a local one usually has none.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]|\/\/(localhost|127\.0\.0\.1)[:/]/.test(url);

const client = postgres(url, { max: 1, ssl: isLocal ? false : "require" });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("The database is up to date.");
} finally {
  await client.end();
}
