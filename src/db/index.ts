import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
 * Fixed by Horizon: don't change this file. Laravel Cloud sets DATABASE_URL
 * when a database is attached. The connection opens on first use, so the
 * app can build without a database.
 */

/** Any database with the app's tables: the real one, or the test one in tests/db.ts. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const client = postgres(process.env.DATABASE_URL ?? "postgres://localhost:5432/app", { max: 5 });

export const db: Database = drizzle(client, { schema });
