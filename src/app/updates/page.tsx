// Fixed by Horizon: don't change this file.
import { ArrowLeft, Mail, UserCog } from "lucide-react";
import { db } from "@/db";
import horizon from "@/horizon.json";
import { Button, Card, EmptyState, Field, FormMessage, List, Row, ScreenHeader, Section, Tag } from "@/kit";
import { requireUser } from "@/lib/session";
import { canManageUpdates, updatesOverview } from "@/lib/updates";
import { addManagerAction, addRecipientAction, removeManagerAction, removeRecipientAction } from "./actions";

/**
 * Email updates: who gets which, the Monday summary, who manages them, and
 * what was sent. Only the community's owners, and people they add, can
 * change anything here.
 */
export default async function UpdatesPage({ searchParams }: PageProps<"/updates">) {
  const user = await requireUser();
  const message = (await searchParams).message;

  if (!(await canManageUpdates(db, user.email))) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <ScreenHeader back={{ label: horizon.name, href: "/" }} icon={Mail} title="Email updates" />
        <EmptyState icon={Mail} title="Only the people who manage updates can change them" description="Ask your community's owner if you'd like to get updates, or help manage them." />
      </main>
    );
  }

  const { kinds, managers, deliveries } = await updatesOverview(db);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <ScreenHeader
        back={{ label: horizon.name, href: "/" }}
        icon={Mail}
        title="Email updates"
        description="Choose who hears about what happens in this app, by email. Each person confirms from their own inbox first, and every email says how to stop."
      />
      {typeof message === "string" && <FormMessage message={message} />}

      {kinds.map((kind) => (
        <Card key={kind.kind} title={kind.label} description={kind.description}>
          <div className="flex flex-col gap-4">
            {kind.recipients.length > 0 && (
              <List framed={false}>
                {kind.recipients.map((recipient) => (
                  <Row
                    key={recipient.id}
                    compact
                    title={recipient.email}
                    actions={
                      <form action={removeRecipientAction}>
                        <input type="hidden" name="id" value={recipient.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Stop
                        </Button>
                      </form>
                    }
                  >
                    {!recipient.confirmed && <Tag tone="warning">Waiting to confirm</Tag>}
                  </Row>
                ))}
              </List>
            )}
            <form action={addRecipientAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <input type="hidden" name="kind" value={kind.kind} />
              <div className="flex-1">
                <Field label="Email someone these updates" name="email" type="email" required maxLength={255} />
              </div>
              <Button type="submit" variant="secondary">
                Ask them
              </Button>
            </form>
          </div>
        </Card>
      ))}

      <Section title="Who manages updates">
        <Card description="Your community's owners always can. Add anyone else who should.">
          <div className="flex flex-col gap-4">
            {managers.length > 0 && (
              <List framed={false}>
                {managers.map((manager) => (
                  <Row
                    key={manager.email}
                    compact
                    title={manager.email}
                    actions={
                      <form action={removeManagerAction}>
                        <input type="hidden" name="email" value={manager.email} />
                        <Button type="submit" variant="ghost" size="sm">
                          Remove
                        </Button>
                      </form>
                    }
                  />
                ))}
              </List>
            )}
            <form action={addManagerAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Their email" name="email" type="email" required maxLength={255} />
              </div>
              <Button type="submit" variant="secondary">
                <UserCog aria-hidden="true" />
                Add
              </Button>
            </form>
          </div>
        </Card>
      </Section>

      <Section title="Sent lately">
        {deliveries.length === 0 ? (
          <EmptyState icon={Mail} title="Nothing sent yet" description="Updates you've set up appear here once they go out. They're kept for 90 days." />
        ) : (
          <List>
            {deliveries.map((delivery) => (
              <Row key={delivery.id} compact title={delivery.subject} description={`${delivery.email} · ${delivery.at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}${delivery.error ? ` · ${delivery.error}` : ""}`}>
                <Tag tone={delivery.status === "sent" ? "good" : delivery.status === "skipped" ? "warning" : "urgent"}>
                  {delivery.status === "sent" ? "Sent" : delivery.status === "skipped" ? "Held back" : "Failed"}
                </Tag>
              </Row>
            ))}
          </List>
        )}
      </Section>

      <Button href="/" variant="ghost" className="self-start">
        <ArrowLeft aria-hidden="true" />
        Back to {horizon.name}
      </Button>
    </main>
  );
}
