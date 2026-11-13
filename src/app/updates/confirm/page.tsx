// Fixed by Horizon: don't change this file.
import { MailCheck } from "lucide-react";
import horizon from "@/horizon.json";
import { Button, Card, ScreenHeader } from "@/kit";
import { labelOf } from "@/lib/updates";
import { confirmAction } from "../actions";

/**
 * Confirming updates from the email. A button rather than the link itself,
 * so a mail program checking links can't confirm for them. Open to anyone:
 * the person may not use the app.
 */
export default async function ConfirmUpdatesPage({ searchParams }: PageProps<"/updates/confirm">) {
  const { token, done, unknown } = await searchParams;
  // The label comes from the app, never from the address, so a link can't make this page say anything else.
  const label = typeof done === "string" ? labelOf(done) : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      {label ? (
        <ScreenHeader icon={MailCheck} title="You're all set" description={`You'll get "${label}" emails from ${horizon.name}. Each one says how to stop.`} />
      ) : unknown || typeof token !== "string" ? (
        <ScreenHeader icon={MailCheck} title="That link doesn't work" description="It may be out of date. Ask whoever set up your updates to send another." />
      ) : (
        <>
          <ScreenHeader icon={MailCheck} title={`Updates from ${horizon.name}`} description="Confirm you'd like these emails. You can stop them at any time." />
          <Card>
            <form action={confirmAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="primary" className="w-full">
                Yes, send me updates
              </Button>
            </form>
          </Card>
        </>
      )}
    </main>
  );
}
