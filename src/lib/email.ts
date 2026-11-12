import horizon from "@/horizon.json";

/*
 * Fixed by Horizon: don't change this file. Sends email through Resend,
 * which Laravel Cloud sets up (RESEND_API_KEY and MAIL_FROM_ADDRESS). This
 * is the only place the app talks to another website.
 */

type Email = { to: string; subject: string; text: string };

export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email to ${to}] ${subject}\n${text}`);

      return;
    }

    throw new Error("Email isn't set up for this app yet.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${horizon.name} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`The email couldn't be sent (${response.status}).`);
  }
}
