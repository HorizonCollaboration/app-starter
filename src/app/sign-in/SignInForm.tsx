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
        If you can use this app, a link to sign in is on its way to your email. It works once, for 15 minutes.
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
      <label className="flex min-h-11 items-start gap-3 text-sm text-ink-muted">
        <input type="checkbox" name="agreed" required className="mt-0.5 size-5 shrink-0" />
        <span>
          I won&apos;t add sensitive personal information to this app, such as patient details or anyone&apos;s health
          records.
        </span>
      </label>
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
