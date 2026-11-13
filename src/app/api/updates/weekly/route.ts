// Fixed by Horizon: don't change this file.
import { db } from "@/db";
import { isFromHorizon, sendWeeklySummary } from "@/lib/updates";

/**
 * Horizon asks each live app for its weekly summary on Monday morning, with
 * a token only it and the app share, since the app has no clock of its own.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFromHorizon(request.headers.get("authorization"))) {
    return Response.json({ error: "Not from Horizon." }, { status: 401 });
  }

  const sentTo = await sendWeeklySummary(db);

  return Response.json({ sentTo });
}
