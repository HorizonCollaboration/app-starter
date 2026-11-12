"use server";

// Fixed by Horizon: don't change this file.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";

export type SignInState = { sent: boolean; error: string | null };

const email = z.email().max(255);

export async function sendSignInLink(_state: SignInState, form: FormData): Promise<SignInState> {
  const parsed = email.safeParse(String(form.get("email") ?? "").trim());

  if (!parsed.success) {
    return { sent: false, error: "Please enter a valid email address." };
  }

  try {
    await auth.api.signInMagicLink({
      body: { email: parsed.data, callbackURL: "/" },
      headers: await headers(),
    });
  } catch {
    return { sent: false, error: "The sign-in link couldn't be sent. Please try again in a few minutes." };
  }

  return { sent: true, error: null };
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
