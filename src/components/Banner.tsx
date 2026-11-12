// Fixed by Horizon: don't change this file.
import horizon from "@/horizon.json";

export default function Banner() {
  return (
    <div className="border-b bg-muted/60 px-4 py-2 text-center text-sm text-muted-foreground">
      Made by a community on{" "}
      <a href={horizon.problemUrl} className="font-medium text-foreground underline underline-offset-2">
        Horizon
      </a>
      , for trying out. Sign in with your email, but please don&apos;t enter any other real personal details.
    </div>
  );
}
