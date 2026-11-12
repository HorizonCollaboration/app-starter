import Link from "next/link";
import horizon from "@/horizon.json";
import { currentUser } from "@/lib/session";
import { signOut } from "./sign-in/actions";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold">{horizon.name}</h1>
      {user ? (
        <div className="flex items-center justify-between gap-4 rounded-card bg-surface p-4 shadow-card">
          <p>Signed in as {user.email}</p>
          <form action={signOut}>
            <button type="submit" className="min-h-11 rounded-control border border-line px-4">
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 w-fit items-center rounded-control bg-primary px-4 font-medium text-on-primary"
        >
          Sign in
        </Link>
      )}
    </main>
  );
}
