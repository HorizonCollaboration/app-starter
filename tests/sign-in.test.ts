// Fixed by Horizon: don't change this file.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { testDatabase } from "./db";

const sent: { to: string; text: string }[] = [];

vi.mock("@/lib/email", () => ({
  sendEmail: async (email: { to: string; text: string }) => {
    sent.push(email);
  },
}));

describe("signing in by email", () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it("emails a link that signs the person in once", async () => {
    const { createAuth } = await import("@/lib/auth");
    const database = await testDatabase();
    const auth = createAuth(database);

    await auth.api.signInMagicLink({ body: { email: "sam@example.com", callbackURL: "/" }, headers: new Headers() });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("sam@example.com");
    const link = sent[0].text.match(/https?:\/\/\S+/)?.[0];
    expect(link).toBeDefined();

    const first = await auth.handler(new Request(link!));
    expect(first.headers.get("set-cookie")).toContain("session_token");

    const people = await database.select().from(schema.user).where(eq(schema.user.email, "sam@example.com"));
    expect(people).toHaveLength(1);

    const second = await auth.handler(new Request(link!));
    expect(second.headers.get("set-cookie") ?? "").not.toContain("session_token=");
  });
});
