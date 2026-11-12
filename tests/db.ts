// Fixed by Horizon: don't change this file.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/db";
import * as schema from "@/db/schema";

/**
 * A fresh, empty Postgres database in memory with every migration applied,
 * for one test. Pass it to the code under test instead of the real `db`.
 */
export async function testDatabase(): Promise<Database> {
  const database = drizzle(new PGlite(), { schema });
  await migrate(database, { migrationsFolder: "./drizzle" });

  return database as unknown as Database;
}
