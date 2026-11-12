// Fixed by Horizon: don't change this file.
import horizon from "@/horizon.json";

export default function Banner() {
  return (
    <div className="bg-sunken border-b border-line px-4 py-2 text-center text-sm text-ink-muted">
      Made by a community on{" "}
      <a href={horizon.problemUrl} className="underline underline-offset-2">
        Horizon
      </a>
      . Please don&apos;t enter real personal information.
    </div>
  );
}
