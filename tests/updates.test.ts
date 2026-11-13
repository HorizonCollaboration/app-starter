// Fixed by Horizon: don't change this file.
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { updateDelivery, updateEvent } from "@/db/updates-schema";
import { testDatabase } from "./db";

const sent: { to: string; subject: string; text: string }[] = [];

vi.mock("@/lib/email", () => ({
  sendEmail: async (email: { to: string; subject: string; text: string }) => {
    sent.push(email);
  },
}));

// An app with one kind of update, as an app declares them in src/updates.ts.
vi.mock("@/updates", () => ({
  updates: { new_request: { label: "A new request", description: "When a food bank asks for something." } },
}));

const updates = await import("@/lib/updates");

/** The link in the last email sent, to the given path. */
function linkTo(path: string): string {
  const match = sent.at(-1)?.text.match(new RegExp(`${path}\\?token=([\\w.-]+)`));

  if (!match) {
    throw new Error(`No ${path} link in the last email.`);
  }

  return match[1];
}

async function confirmed(db: Database, email: string, kind: string) {
  await updates.addRecipient(db, email, kind, "Priya");
  await updates.confirmRecipient(db, linkTo("/updates/confirm"));
}

describe("email updates", () => {
  let db: Database;

  beforeEach(async () => {
    sent.length = 0;
    db = await testDatabase();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("only emails people who confirmed from their own inbox", async () => {
    await updates.addRecipient(db, "Coordinator@Example.com", "new_request", "Priya");
    expect(sent.at(-1)).toMatchObject({ to: "coordinator@example.com" });

    await updates.notify(db, "new_request" as never, "Riverside needs 20 tins of beans.");
    expect(sent).toHaveLength(1);

    await updates.confirmRecipient(db, linkTo("/updates/confirm"));
    await updates.notify(db, "new_request" as never, "Riverside needs 20 tins of beans.");

    expect(sent.at(-1)).toMatchObject({ to: "coordinator@example.com", subject: expect.stringContaining("A new request") });
    expect(sent.at(-1)?.text).toContain("Riverside needs 20 tins of beans.");
    expect(await db.$count(updateDelivery, eq(updateDelivery.event, "new_request"))).toBe(1);
  });

  it("stops for good from the link in any email", async () => {
    await confirmed(db, "sam@example.com", "new_request");
    await updates.notify(db, "new_request" as never, "First.");
    const firstStop = linkTo("/updates/stop");
    await updates.notify(db, "new_request" as never, "Second.");

    expect(await updates.stopRecipient(db, firstStop)).toBe("new_request");

    await updates.notify(db, "new_request" as never, "Third.");
    expect(sent.at(-1)?.text).not.toContain("Third.");
  });

  it("doesn't accept a stop link it didn't sign", async () => {
    await confirmed(db, "sam@example.com", "new_request");
    await updates.notify(db, "new_request" as never, "Hello.");
    const [id] = linkTo("/updates/stop").split(".");

    expect(await updates.stopRecipient(db, `${id}.forged`)).toBeNull();
  });

  it("ignores a kind of update the app hasn't declared", async () => {
    await updates.notify(db, "something_else" as never, "Nope.");

    expect(await db.$count(updateEvent)).toBe(0);
  });

  it("sends the weekly summary of what happened, and nothing in a quiet week", async () => {
    await confirmed(db, "group@example.com", updates.Weekly);
    expect(await updates.sendWeeklySummary(db)).toBe(0);

    await updates.notify(db, "new_request" as never, "Riverside needs beans.");
    await updates.notify(db, "new_request" as never, "Hillside needs nappies.");

    expect(await updates.sendWeeklySummary(db)).toBe(1);
    expect(sent.at(-1)?.text).toContain("A new request (2)");
    expect(sent.at(-1)?.text).toContain("- Hillside needs nappies.");
  });

  it("sends the weekly summary once, however often Horizon asks that week", async () => {
    await confirmed(db, "group@example.com", updates.Weekly);
    await updates.notify(db, "new_request" as never, "Riverside needs beans.");

    expect(await updates.sendWeeklySummary(db)).toBe(1);
    expect(await updates.sendWeeklySummary(db)).toBe(0);
    expect(sent.filter((email) => email.subject.startsWith("This week"))).toHaveLength(1);
  });

  it("asks someone to confirm at most once a day, and only so many people an hour", async () => {
    expect(await updates.addRecipient(db, "sam@example.com", "new_request", "owner@example.com")).toBe("asked");
    expect(await updates.addRecipient(db, "sam@example.com", "new_request", "owner@example.com")).toBe("recently");
    expect(sent.at(-1)?.text).toContain("owner@example.com would like to send you");

    for (let n = 1; n < 20; n++) {
      await updates.addRecipient(db, `person${n}@example.com`, "new_request", "owner@example.com");
    }

    expect(await updates.addRecipient(db, "one-too-many@example.com", "new_request", "owner@example.com")).toBe("busy");
  });

  it("holds back emails to anyone who's had too many of one kind this hour, and says so", async () => {
    await confirmed(db, "sam@example.com", "new_request");

    for (let n = 0; n < 11; n++) {
      await updates.notify(db, "new_request" as never, `Request ${n}.`);
    }

    const overview = await updates.updatesOverview(db);
    expect(overview.deliveries.filter((delivery) => delivery.status === "sent" && delivery.subject.startsWith("A new request"))).toHaveLength(10);
    expect(overview.deliveries.filter((delivery) => delivery.status === "skipped")).toHaveLength(1);
  });

  it("only sends the weekly summary when Horizon asks, with its token", () => {
    vi.stubEnv("HORIZON_TRIGGER_TOKEN", "horizon-secret");

    expect(updates.isFromHorizon("Bearer horizon-secret")).toBe(true);
    expect(updates.isFromHorizon("Bearer guess")).toBe(false);
    expect(updates.isFromHorizon(null)).toBe(false);
  });

  it("lets the community's owners, and people they add, manage updates", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HORIZON_ACCESS_URL", "https://horizon.test/api/apps/abc/access");
    vi.stubEnv("HORIZON_ACCESS_TOKEN", "app-token");
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
      const { email } = JSON.parse(init.body) as { email: string };

      return new Response(JSON.stringify({ allowed: true, manages_updates: email === "owner@example.com" }));
    }));

    expect(await updates.canManageUpdates(db, "owner@example.com")).toBe(true);
    expect(await updates.canManageUpdates(db, "member@example.com")).toBe(false);

    await updates.addManager(db, "Member@Example.com", "owner@example.com");
    expect(await updates.canManageUpdates(db, "member@example.com")).toBe(true);
  });
});
