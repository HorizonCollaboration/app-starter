"use client";

// Fixed by Horizon: don't change this file.
import { useActionState } from "react";
import { sendSignInLink, type SignInState } from "./actions";

const initial: SignInState = { sent: false, error: null };

export default function SignInForm() {
  const [state, action, pending] = useActionState(sendSignInLink, initial);

  if (state.sent) {
    return (
      <p className="rounded-card bg-success-soft p-4 text-ink">
        Check your email for a link to sign in. It works once, for 15 minutes.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="font-medium">
        Your email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="min-h-11 rounded-control border border-line bg-surface px-3"
      />
      {state.error && <p className="text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-control bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send me a sign-in link"}
      </button>
    </form>
  );
}
