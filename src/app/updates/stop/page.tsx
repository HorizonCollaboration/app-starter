// Fixed by Horizon: don't change this file.
import { MailX } from "lucide-react";
import horizon from "@/horizon.json";
import { Button, Card, ScreenHeader } from "@/kit";
import { labelOf } from "@/lib/updates";
import { stopAction } from "../actions";

/** Stopping updates from the link in an email. Open to anyone: the person may not use the app. */
export default async function StopUpdatesPage({ searchParams }: PageProps<"/updates/stop">) {
  const { token, done, unknown } = await searchParams;
  // The label comes from the app, never from the address, so a link can't make this page say anything else.
  const label = typeof done === "string" ? labelOf(done) : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      {label ? (
        <ScreenHeader icon={MailX} title="Stopped" description={`You won't get "${label}" emails from ${horizon.name} any more.`} />
      ) : unknown || typeof token !== "string" ? (
        <ScreenHeader icon={MailX} title="That link doesn't work" description="You may have stopped these emails already." />
      ) : (
        <>
          <ScreenHeader icon={MailX} title={`Stop updates from ${horizon.name}?`} description="You can ask to get them again later." />
          <Card>
            <form action={stopAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="danger" className="w-full">
                Stop these emails
              </Button>
            </form>
          </Card>
        </>
      )}
    </main>
  );
}
