/*
 * Fixed by Horizon: don't change this file. Before a sign-in link is sent,
 * and again while someone stays signed in, the app asks Horizon whether that
 * email may use it: anyone, unless the app is members only, when they must
 * belong to its community. Horizon sets HORIZON_ACCESS_URL and
 * HORIZON_ACCESS_TOKEN when it puts the app live.
 */

/** How long a yes is trusted before asking again, and how long one is kept when Horizon can't be reached. */
const askAgainAfter = 5 * 60 * 1000;
const keepWhenUnreachable = 60 * 60 * 1000;

/** After Horizon fails to answer anyone, how long to wait before asking it again, so a slow Horizon doesn't hold up every page. */
const waitAfterFailure = 60 * 1000;

const yeses = new Map<string, number>();
let failedAt = -Infinity;

export async function maySignIn(email: string): Promise<boolean> {
  const url = process.env.HORIZON_ACCESS_URL;
  const token = process.env.HORIZON_ACCESS_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") {
      // Fine while developing (npm run dev).
      return true;
    }

    throw new Error("HORIZON_ACCESS_URL and HORIZON_ACCESS_TOKEN aren't set, so nobody can sign in. Horizon sets them when it puts the app live.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.toLowerCase() }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Horizon couldn't say who may sign in (${response.status}).`);
  }

  const answer = (await response.json()) as { allowed?: unknown };

  return answer.allowed === true;
}

/**
 * Whether someone who's signed in may still use the app: "yes", "no" (Horizon
 * said so, say they left a members-only app's community), or "unsure" (Horizon
 * couldn't answer, and there's no recent yes to go on). Only a yes is
 * remembered, so someone who rejoins is let straight back in.
 */
export async function mayStaySignedIn(email: string): Promise<"yes" | "no" | "unsure"> {
  const key = email.toLowerCase();
  const now = Date.now();
  const lastYes = yeses.get(key);
  const recentYes = lastYes !== undefined && now - lastYes < keepWhenUnreachable;

  if (lastYes !== undefined && now - lastYes < askAgainAfter) {
    return "yes";
  }

  if (now - failedAt < waitAfterFailure) {
    return recentYes ? "yes" : "unsure";
  }

  try {
    const allowed = await maySignIn(email);

    if (yeses.size > 10_000) {
      yeses.clear();
    }

    if (allowed) {
      yeses.set(key, now);
    } else {
      yeses.delete(key);
    }

    return allowed ? "yes" : "no";
  } catch (error) {
    console.error("Horizon couldn't say who may use the app:", error);
    failedAt = now;

    return recentYes ? "yes" : "unsure";
  }
}

/** For tests: forget every answer. */
export function forgetAnswers(): void {
  yeses.clear();
  failedAt = -Infinity;
}
