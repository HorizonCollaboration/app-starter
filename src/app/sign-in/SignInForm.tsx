"use client";

// Fixed by Horizon: don't change this file.
import { useActionState } from "react";
import { Button, Field, FormMessage } from "@/kit";
import { sendSignInLink, type SignInState } from "./actions";

const initial: SignInState = { sent: false, error: null };

export default function SignInForm() {
  const [state, action, pending] = useActionState(sendSignInLink, initial);

  if (state.sent) {
    return <FormMessage message="If you can use this app, a link to sign in is on its way to your email. It works once, for 15 minutes." />;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Your email address" name="email" type="email" autoComplete="email" required />
      <label className="flex min-h-11 items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="agreed" required className="mt-0.5 size-5 shrink-0 accent-primary" />
        <span>
          I won&apos;t add sensitive personal information to this app, such as patient details or anyone&apos;s health
          records.
        </span>
      </label>
      <FormMessage error={state.error} />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Sending…" : "Send me a sign-in link"}
      </Button>
    </form>
  );
}
