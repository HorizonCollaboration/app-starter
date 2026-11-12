// Fixed by Horizon: don't change this file.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgetAnswers, maySignIn, mayStaySignedIn } from "@/lib/access";
import { testDatabase } from "./db";

const sent: { to: string }[] = [];

vi.mock("@/lib/email", () => ({
  sendEmail: async (email: { to: string }) => {
    sent.push(email);
  },
}));

function horizonSays(allowed: boolean, status = 200) {
  const ask = vi.fn(async () => new Response(JSON.stringify({ allowed }), { status }));
  vi.stubGlobal("fetch", ask);

  return ask;
}

describe("asking Horizon who may sign in", () => {
  beforeEach(() => {
    sent.length = 0;
    forgetAnswers();
    vi.stubEnv("HORIZON_ACCESS_URL", "https://horizon.test/api/apps/abc/access");
    vi.stubEnv("HORIZON_ACCESS_TOKEN", "app-token");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("asks with the app's token, and sends a link to someone Horizon allows", async () => {
    const ask = horizonSays(true);
    const { createAuth } = await import("@/lib/auth");
    const auth = createAuth(await testDatabase());

    await auth.api.signInMagicLink({ body: { email: "sam@example.com", callbackURL: "/" }, headers: new Headers() });

    expect(sent.map((email) => email.to)).toEqual(["sam@example.com"]);
    expect(ask).toHaveBeenCalledWith(
      "https://horizon.test/api/apps/abc/access",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer app-token" }),
        body: JSON.stringify({ email: "sam@example.com" }),
      }),
    );
  });

  it("quietly sends nothing to someone Horizon doesn't allow", async () => {
    horizonSays(false);
    const { createAuth } = await import("@/lib/auth");
    const auth = createAuth(await testDatabase());

    await auth.api.signInMagicLink({ body: { email: "alex@example.com", callbackURL: "/" }, headers: new Headers() });

    expect(sent).toHaveLength(0);
  });

  it("lets nobody in when Horizon can't answer", async () => {
    horizonSays(true, 500);

    await expect(maySignIn("sam@example.com")).rejects.toThrow();
  });

  it("lets nobody into a live app that Horizon hasn't set up, and says why", async () => {
    vi.stubEnv("HORIZON_ACCESS_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    await expect(maySignIn("sam@example.com")).rejects.toThrow("HORIZON_ACCESS_URL");
  });

  it("asks again after a few minutes whether someone signed in may stay", async () => {
    vi.useFakeTimers();
    const ask = horizonSays(true);

    expect(await mayStaySignedIn("sam@example.com")).toBe("yes");
    expect(await mayStaySignedIn("Sam@Example.com")).toBe("yes");
    expect(ask).toHaveBeenCalledTimes(1);

    horizonSays(false);
    vi.advanceTimersByTime(6 * 60 * 1000);

    expect(await mayStaySignedIn("sam@example.com")).toBe("no");
  });

  it("keeps a recent yes while Horizon can't be reached, but is only unsure after that", async () => {
    vi.useFakeTimers();
    horizonSays(true);
    await mayStaySignedIn("sam@example.com");

    horizonSays(true, 503);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(await mayStaySignedIn("sam@example.com")).toBe("yes");

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(await mayStaySignedIn("sam@example.com")).toBe("unsure");
  });

  it("doesn't keep asking a Horizon that just failed to answer, for anyone", async () => {
    vi.useFakeTimers();
    const ask = horizonSays(true, 503);

    expect(await mayStaySignedIn("sam@example.com")).toBe("unsure");
    expect(await mayStaySignedIn("alex@example.com")).toBe("unsure");
    expect(ask).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * 60 * 1000);
    horizonSays(true);
    expect(await mayStaySignedIn("alex@example.com")).toBe("yes");
  });

  it("lets someone who rejoins straight back in", async () => {
    horizonSays(false);
    expect(await mayStaySignedIn("sam@example.com")).toBe("no");

    horizonSays(true);
    expect(await mayStaySignedIn("sam@example.com")).toBe("yes");
  });

  it("only sends sign-in links from the sign-in page, where people agree first", async () => {
    const ask = horizonSays(true);
    const { auth } = await import("@/lib/auth");

    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sam@example.com", callbackURL: "/" }),
      }),
    );

    expect(response.status).toBe(404);
    expect(sent).toHaveLength(0);
    expect(ask).not.toHaveBeenCalled();
  });

  it("keeps every page of a members-only app behind sign-in", async () => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");

    vi.stubEnv("HORIZON_MEMBERS_ONLY", "true");

    for (const path of ["/", "/stock", "/sign-in-help", "/sign-in/x", "/api/auth", "/api/authors", "/api/stock"]) {
      const guest = await proxy(new NextRequest(`http://localhost:3000${path}`));
      expect(guest.headers.get("location"), path).toBe("http://localhost:3000/sign-in");
    }

    for (const path of ["/sign-in", "/api/auth/magic-link/verify"]) {
      const signingIn = await proxy(new NextRequest(`http://localhost:3000${path}`));
      expect(signingIn.headers.get("location"), path).toBeNull();
    }

    vi.stubEnv("HORIZON_MEMBERS_ONLY", "");
    const open = await proxy(new NextRequest("http://localhost:3000/stock"));
    expect(open.headers.get("location")).toBeNull();
  });
});
