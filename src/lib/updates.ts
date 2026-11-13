import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gte, isNotNull, isNull, like, lt, or } from "drizzle-orm";
import type { Database } from "@/db";
import { updateDelivery, updateEvent, updateManager, updateRecipient } from "@/db/updates-schema";
import horizon from "@/horizon.json";
import { updates, type UpdateKind } from "@/updates";
import { managesUpdates as horizonSaysManages } from "./access";
import { sendEmail } from "./email";

/*
 * Fixed by Horizon: don't change this file. Email updates: the app says what
 * happened with notify(), and the people who manage updates choose who hears
 * about it. Nobody gets anything until they've confirmed from their own
 * inbox, and every email says how to stop. App code may only use notify().
 */

/** The Monday summary, alongside the app's own kinds of update in src/updates.ts. */
export const Weekly = "weekly";

/** Asking someone to confirm, logged with what was sent as "confirm:<kind>". */
const Confirming = "confirm";

/** At most this many emails a second, under Resend's own limit. */
const perSecond = 4;

const day = 24 * 60 * 60 * 1000;

/** How long what happened, and what was sent, is kept. */
const keepDays = 90;

/** At most this many emails of one kind to one person in an hour, so a busy hour or a mistake can't flood anyone. */
const perPersonPerHour = 10;

/** At most this many people asked to confirm in an hour, and each asked again at most once a day. */
const confirmationsPerHour = 20;

/** The app's own kinds of update, never one of the names Horizon keeps for itself. */
const declared = Object.fromEntries(
  Object.entries(updates as Record<string, { label: string; description: string }>).filter(([kind]) => kind !== Weekly && kind !== Confirming && !kind.includes(":")),
);

/** The kinds of update people can choose, with the Monday summary first. */
export function updateKinds(): { kind: string; label: string; description: string }[] {
  return [
    { kind: Weekly, label: "Weekly summary", description: "Every Monday morning: everything that happened in the past week, in one email." },
    ...Object.entries(declared).map(([kind, { label, description }]) => ({ kind, label, description })),
  ];
}

/** A kind of update's label, if it's one of the app's. */
export function labelOf(kind: string): string | null {
  return updateKinds().find((option) => option.kind === kind)?.label ?? null;
}

/**
 * Tells the people who chose this kind of update that it happened, in a
 * sentence or two, such as "Riverside food bank needs 20 tins of beans". It
 * also goes in the weekly summary. Never fails the action that called it.
 */
export async function notify(db: Database, kind: UpdateKind, summary: string): Promise<void> {
  const label = declared[kind]?.label;

  if (!label) {
    return;
  }

  const text = summary.trim().slice(0, 1000);

  try {
    await db.insert(updateEvent).values({ id: randomUUID(), event: kind, summary: text });

    // Now and then, rather than only when Horizon asks for the weekly summary.
    if (Math.random() < 0.01) {
      await forgetOld(db, new Date());
    }

    const recipients = await confirmedFor(db, kind);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // A few at a time, so the person's action doesn't wait on one email after another, nor trip Resend's limit.
    await inBatches(
      recipients,
      async (recipient) => {
        const lately = await db.$count(
          updateDelivery,
          and(eq(updateDelivery.email, recipient.email), eq(updateDelivery.event, kind), eq(updateDelivery.status, "sent"), gte(updateDelivery.createdAt, hourAgo)),
        );

        if (lately >= perPersonPerHour) {
          await log(db, recipient.email, kind, `${label}: ${horizon.name}`, "skipped", "Too many this hour.");

          return;
        }

        await deliver(db, recipient, kind, `${label}: ${horizon.name}`, `${text}\n\nSee it in ${horizon.name}: ${siteUrl()}`);
      },
    );
  } catch (error) {
    console.error("An update couldn't be sent:", error);
  }
}

/**
 * The Monday summary: what happened in the past week, to everyone who chose
 * it and hasn't had it this week, so asking again (a retry, a second run)
 * only reaches whoever was missed. Horizon asks for it each week. Also clears
 * out anything past 90 days.
 */
export async function sendWeeklySummary(db: Database, now = new Date()): Promise<number> {
  await forgetOld(db, now);

  const happened = await db
    .select()
    .from(updateEvent)
    .where(gte(updateEvent.createdAt, new Date(now.getTime() - 7 * day)))
    .orderBy(asc(updateEvent.createdAt));

  if (happened.length === 0) {
    return 0;
  }

  const alreadySent = new Set(
    (
      await db
        .select({ email: updateDelivery.email })
        .from(updateDelivery)
        .where(and(eq(updateDelivery.event, Weekly), eq(updateDelivery.status, "sent"), gte(updateDelivery.createdAt, new Date(now.getTime() - 6 * day))))
    ).map((row) => row.email),
  );

  const lines = updateKinds()
    .filter(({ kind }) => kind !== Weekly)
    .flatMap(({ kind, label }) => {
      const these = happened.filter((event) => event.event === kind);

      return these.length === 0 ? [] : [`${label} (${these.length})`, ...these.map((event) => `- ${event.summary}`), ""];
    });

  const recipients = (await confirmedFor(db, Weekly)).filter((recipient) => !alreadySent.has(recipient.email));

  const sent = await inBatches(recipients, (recipient) =>
    deliver(db, recipient, Weekly, `This week in ${horizon.name}`, `${lines.join("\n")}\nSee everything in ${horizon.name}: ${siteUrl()}`),
  );

  return sent.filter(Boolean).length;
}

/**
 * Whether this signed-in person manages the app's updates: one of its
 * community's owners (Horizon says), or someone they've added.
 */
export async function canManageUpdates(db: Database, email: string): Promise<boolean> {
  const added = await db.$count(updateManager, eq(updateManager.email, email.toLowerCase()));

  return added > 0 || (await horizonSaysManages(email));
}

export type AddResult = "asked" | "already" | "recently" | "busy";

/**
 * Asks someone whether they'd like this kind of update: they get an email to
 * confirm, and nothing else until they do. Asked once a day at most for each
 * kind, claimed in one step so a double click sends one email, and only so
 * many people an hour, so the app can't be used to fill a stranger's inbox.
 * Named by the manager's email, which they can't make say anything else.
 */
export async function addRecipient(db: Database, email: string, kind: string, managerEmail: string): Promise<AddResult> {
  const address = email.trim().toLowerCase();
  const label = labelOf(kind);

  if (!label) {
    throw new Error("That isn't one of this app's updates.");
  }

  const now = new Date();
  const [existing] = await db.select().from(updateRecipient).where(and(eq(updateRecipient.email, address), eq(updateRecipient.event, kind)));

  if (existing?.confirmedAt) {
    return "already";
  }

  const askedThisHour = await db.$count(
    updateDelivery,
    and(like(updateDelivery.event, `${Confirming}:%`), eq(updateDelivery.status, "sent"), gte(updateDelivery.createdAt, new Date(now.getTime() - 60 * 60 * 1000))),
  );

  if (askedThisHour >= confirmationsPerHour) {
    return "busy";
  }

  const token = randomBytes(32).toString("base64url");
  const claimed = existing
    ? await db
        .update(updateRecipient)
        .set({ tokenHash: hash(token), askedAt: now })
        .where(and(eq(updateRecipient.id, existing.id), or(isNull(updateRecipient.askedAt), lt(updateRecipient.askedAt, new Date(now.getTime() - day)))))
        .returning()
    : await db
        .insert(updateRecipient)
        .values({ id: randomUUID(), email: address, event: kind, tokenHash: hash(token), askedAt: now, addedBy: managerEmail })
        .onConflictDoNothing()
        .returning();

  if (claimed.length === 0) {
    return "recently";
  }

  const subject = `Would you like updates from ${horizon.name}?`;

  try {
    await sendEmail({
      to: address,
      subject,
      text: [
        `${managerEmail} would like to send you "${label}" emails from ${horizon.name}, an app made by a community on Horizon.`,
        "",
        `To start getting them, confirm here: ${siteUrl()}/updates/confirm?token=${token}`,
        "",
        "If you don't want them, ignore this email. You'll only be asked again if someone adds you another day.",
      ].join("\n"),
    });
    await log(db, address, `${Confirming}:${kind}`, subject, "sent");
  } catch (error) {
    // Not sent, so they can be asked again straight away.
    await db.update(updateRecipient).set({ askedAt: null }).where(eq(updateRecipient.id, claimed[0].id));
    await log(db, address, `${Confirming}:${kind}`, subject, "failed", reason(error));
    throw error;
  }

  return "asked";
}

/** Confirms from the link in the email. The kind of update it was for, or null if the link is unknown. */
export async function confirmRecipient(db: Database, token: string): Promise<string | null> {
  const [recipient] = await db.select().from(updateRecipient).where(eq(updateRecipient.tokenHash, hash(token)));

  if (!recipient) {
    return null;
  }

  if (!recipient.confirmedAt) {
    await db.update(updateRecipient).set({ confirmedAt: new Date() }).where(eq(updateRecipient.id, recipient.id));
  }

  return recipient.event;
}

/** Stops the update the link in an email was for. The kind it was, or null if the link isn't one of the app's. */
export async function stopRecipient(db: Database, token: string): Promise<string | null> {
  const [id, signature] = token.split(".");

  if (!id || !signature || !sameText(signature, sign(id))) {
    return null;
  }

  const [recipient] = await db.delete(updateRecipient).where(eq(updateRecipient.id, id)).returning();

  return recipient?.event ?? null;
}

/** Stops someone's update, by the people who manage updates. */
export async function removeRecipient(db: Database, id: string): Promise<void> {
  await db.delete(updateRecipient).where(eq(updateRecipient.id, id));
}

/** Lets someone else manage updates. */
export async function addManager(db: Database, email: string, addedBy: string): Promise<void> {
  await db
    .insert(updateManager)
    .values({ email: email.trim().toLowerCase(), addedBy })
    .onConflictDoNothing();
}

export async function removeManager(db: Database, email: string): Promise<void> {
  await db.delete(updateManager).where(eq(updateManager.email, email.toLowerCase()));
}

/** Everything the Updates page shows. */
export async function updatesOverview(db: Database) {
  const [recipients, managers, deliveries] = await Promise.all([
    db.select().from(updateRecipient).orderBy(asc(updateRecipient.email)),
    db.select().from(updateManager).orderBy(asc(updateManager.email)),
    db.select().from(updateDelivery).orderBy(desc(updateDelivery.createdAt)).limit(50),
  ]);

  return {
    kinds: updateKinds().map((option) => ({
      ...option,
      recipients: recipients
        .filter((recipient) => recipient.event === option.kind)
        .map((recipient) => ({ id: recipient.id, email: recipient.email, confirmed: recipient.confirmedAt !== null })),
    })),
    managers: managers.map((manager) => ({ email: manager.email, addedBy: manager.addedBy })),
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      email: delivery.email,
      subject: delivery.subject,
      status: delivery.status,
      error: delivery.error,
      at: delivery.createdAt,
    })),
  };
}

/** Whether a request to send the weekly summary really came from Horizon. */
export function isFromHorizon(authorization: string | null): boolean {
  const expected = process.env.HORIZON_TRIGGER_TOKEN;
  const given = authorization?.replace(/^Bearer /, "") ?? "";

  return Boolean(expected) && sameText(given, expected as string);
}

function sameText(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

/** A stop link's signature, with the app's own secret (the one sign-in uses). Never with a made-up one in production. */
function sign(id: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET isn't set. Horizon sets it when it puts the app live.");
  }

  return createHmac("sha256", secret ?? "local-development-secret-not-for-production")
    .update(`stop-updates:${id}`)
    .digest("base64url");
}

async function confirmedFor(db: Database, kind: string) {
  return db
    .select()
    .from(updateRecipient)
    .where(and(eq(updateRecipient.event, kind), isNotNull(updateRecipient.confirmedAt)));
}

/** Runs $send for each, a few a second. Whether each was sent. */
async function inBatches<T>(items: T[], send: (item: T) => Promise<boolean | void>): Promise<boolean[]> {
  const results: boolean[] = [];

  for (let start = 0; start < items.length; start += perSecond) {
    if (start > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const batch = await Promise.allSettled(items.slice(start, start + perSecond).map(send));
    results.push(...batch.map((result) => result.status === "fulfilled" && result.value !== false));
  }

  return results;
}

async function deliver(db: Database, recipient: { id: string; email: string }, kind: string, subject: string, body: string): Promise<boolean> {
  try {
    await sendEmail({
      to: recipient.email,
      subject,
      // Signed, not stored: every email's link keeps working until they stop.
      text: `${body}\n\nTo stop these emails: ${siteUrl()}/updates/stop?token=${recipient.id}.${sign(recipient.id)}`,
    });
    await log(db, recipient.email, kind, subject, "sent");

    return true;
  } catch (error) {
    await log(db, recipient.email, kind, subject, "failed", reason(error));

    return false;
  }
}

async function log(db: Database, email: string, kind: string, subject: string, status: "sent" | "failed" | "skipped", error: string | null = null): Promise<void> {
  await db.insert(updateDelivery).values({ id: randomUUID(), email, event: kind, subject, status, error });
}

async function forgetOld(db: Database, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - keepDays * day);
  await db.delete(updateEvent).where(lt(updateEvent.createdAt, cutoff));
  await db.delete(updateDelivery).where(lt(updateDelivery.createdAt, cutoff));
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "It couldn't be sent.";
}

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
