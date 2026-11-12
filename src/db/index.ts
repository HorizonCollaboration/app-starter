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

const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/app";

/** Laravel Cloud's databases only accept encrypted connections; a local one usually has none. */
const isLocal = /@(localhost|127\.0\.0\.1)[:/]|\/\/(localhost|127\.0\.0\.1)[:/]/.test(url);

const client = postgres(url, { max: 5, ssl: isLocal ? false : "require" });

export const db: Database = drizzle(client, { schema });
