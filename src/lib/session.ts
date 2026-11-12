import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/*
 * Fixed by Horizon: don't change this file. Use these in every page and
 * server action that shows or changes someone's data.
 */

export type SignedInUser = { id: string; name: string; email: string };

/** The person signed in, or null. */
export async function currentUser(): Promise<SignedInUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/** The person signed in; anyone else is sent to the sign-in page. */
export async function requireUser(): Promise<SignedInUser> {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
