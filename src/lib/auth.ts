import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db, type Database } from "@/db";
import * as schema from "@/db/auth-schema";
import horizon from "@/horizon.json";
import { sendEmail } from "./email";

/*
 * Fixed by Horizon: don't change this file. People sign in with a link sent
 * to their email; there are no passwords. Laravel Cloud sets
 * NEXT_PUBLIC_SITE_URL, and Horizon sets BETTER_AUTH_SECRET.
 */

export function createAuth(database: Database) {
  return betterAuth({
    appName: horizon.name,
    baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET ?? "local-development-secret-not-for-production",
    database: drizzleAdapter(database, { provider: "pg", schema }),
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }) => {
          await sendEmail({
            to: email,
            subject: `Sign in to ${horizon.name}`,
            text: `Use this link to sign in to ${horizon.name}. It works once, for 15 minutes.\n\n${url}\n\nIf you didn't ask for it, you can ignore this email.`,
          });
        },
      }),
      nextCookies(),
    ],
  });
}

export const auth = createAuth(db);
