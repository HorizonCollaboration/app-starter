import { LogIn, LogOut, Sparkles } from "lucide-react";
import horizon from "@/horizon.json";
import { AppShell, Button, EmptyState, ScreenHeader } from "@/kit";
import { currentUser } from "@/lib/session";
import { signOut } from "./sign-in/actions";

/** A placeholder: the app's own screens replace it. */
export default async function Home() {
  const user = await currentUser();

  return (
    <AppShell
      name={horizon.name}
      icon={Sparkles}
      account={
        user ? (
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="md:w-full md:justify-start">
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </form>
        ) : (
          <Button href="/sign-in" variant="secondary" size="sm" className="md:w-full">
            <LogIn aria-hidden="true" />
            Sign in
          </Button>
        )
      }
    >
      <ScreenHeader icon={Sparkles} title={horizon.name} description={user ? `Signed in as ${user.email}.` : "Sign in to get started."} />
      <EmptyState icon={Sparkles} title="Nothing here yet" description="This app's screens will appear here." />
    </AppShell>
  );
}
