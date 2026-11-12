// Fixed by Horizon: don't change this file.
import horizon from "@/horizon.json";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold">Sign in to {horizon.name}</h1>
      <SignInForm />
    </main>
  );
}
