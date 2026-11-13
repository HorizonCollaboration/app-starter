// Fixed by Horizon: don't change this file.
import { NextResponse, type NextRequest } from "next/server";
import { signedInUser } from "@/lib/session";

/*
 * A members-only app shows nothing to anyone who isn't signed in and still a
 * member: every page, action and route, whatever the app's own code does.
 * Horizon sets HORIZON_MEMBERS_ONLY when it puts such an app live.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (process.env.HORIZON_MEMBERS_ONLY !== "true" || isOpenToEveryone(new URL(request.url).pathname)) {
    return NextResponse.next();
  }

  // Without refreshing the session: the page itself does that, so its new cookie reaches the browser.
  if (!(await signedInUser(request.headers, { refresh: false }))) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

/**
 * Signing in itself: exactly "/sign-in", and better-auth's own routes under "/api/auth/", never "/sign-in-help" or "/api/authors".
 * And email updates: confirming or stopping them from an email (the person may not use the app), and Horizon asking for the weekly summary.
 */
function isOpenToEveryone(path: string): boolean {
  return (
    path === "/sign-in" ||
    path.startsWith("/api/auth/") ||
    path === "/updates/confirm" ||
    path === "/updates/stop" ||
    path === "/api/updates/weekly"
  );
}

export const config = {
  // Everything but the files Next.js serves for every page.
  matcher: ["/((?!_next/static/|_next/image/|favicon\\.ico$).*)"],
};
