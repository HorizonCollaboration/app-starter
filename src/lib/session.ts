import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { session as sessions } from "@/db/auth-schema";
import { mayStaySignedIn } from "./access";
import { auth } from "./auth";

/*
 * Fixed by Horizon: don't change this file. Use these in every page and
 * server action that shows or changes someone's data.
 */

export type SignedInUser = { id: string; name: string; email: string };

/**
 * The person signed in with these request headers, if they may still use the
 * app. Someone Horizon says may not (say, they left a members-only app's
 * community) has every session ended; if Horizon can't answer, they're only
 * treated as signed out for now. Also used by src/proxy.ts.
 */
export async function signedInUser(requestHeaders: Headers, options: { refresh: boolean }): Promise<SignedInUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders, query: { disableRefresh: !options.refresh } });

  if (!session) {
    return null;
  }

  const answer = await mayStaySignedIn(session.user.email);

  if (answer === "no") {
    await db.delete(sessions).where(eq(sessions.userId, session.user.id));
  }

  return answer === "yes" ? { id: session.user.id, name: session.user.name, email: session.user.email } : null;
}

/** The person signed in, or null. */
export async function currentUser(): Promise<SignedInUser | null> {
  return signedInUser(await headers(), { refresh: true });
}

/** The person signed in; anyone else is sent to the sign-in page. */
export async function requireUser(): Promise<SignedInUser> {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
