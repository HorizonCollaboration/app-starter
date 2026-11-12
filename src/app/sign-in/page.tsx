// Fixed by Horizon: don't change this file.
import { LogIn } from "lucide-react";
import horizon from "@/horizon.json";
import { Card, ScreenHeader } from "@/kit";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <ScreenHeader icon={LogIn} title={`Sign in to ${horizon.name}`} description="We'll email you a link. No password needed." />
      <Card>
        <SignInForm />
      </Card>
    </main>
  );
}
