"use server";

// Fixed by Horizon: don't change this file.
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { type AddResult, addManager, addRecipient, canManageUpdates, confirmRecipient, removeManager, removeRecipient, stopRecipient } from "@/lib/updates";
import { requireUser } from "@/lib/session";

const email = z.email().max(255);

/** Only the people who manage updates may change them. */
async function requireManager() {
  const user = await requireUser();

  if (!(await canManageUpdates(db, user.email))) {
    redirect("/updates");
  }

  return user;
}

function back(message: string): never {
  redirect(`/updates?message=${encodeURIComponent(message)}`);
}

const asked: Record<AddResult, (email: string) => string> = {
  asked: (email) => `We've asked ${email} to confirm. Nothing is sent until they do.`,
  already: (email) => `${email} already gets these.`,
  recently: (email) => `${email} was asked in the last day. They can confirm from that email.`,
  busy: () => "Lots of people have been asked this hour. Please try again later.",
};

export async function addRecipientAction(form: FormData): Promise<void> {
  const user = await requireManager();
  const address = email.safeParse(String(form.get("email") ?? "").trim());

  if (!address.success) {
    back("Please enter a valid email address.");
  }

  let result: AddResult;

  try {
    result = await addRecipient(db, address.data, String(form.get("kind") ?? ""), user.email);
  } catch (error) {
    console.error("Asking someone about updates failed:", error);
    back("That email couldn't be sent. Please try again in a few minutes.");
  }

  back(asked[result](address.data));
}

export async function removeRecipientAction(form: FormData): Promise<void> {
  await requireManager();
  await removeRecipient(db, String(form.get("id") ?? ""));
  back("Stopped.");
}

export async function addManagerAction(form: FormData): Promise<void> {
  const user = await requireManager();
  const address = email.safeParse(String(form.get("email") ?? "").trim());

  if (!address.success) {
    back("Please enter a valid email address.");
  }

  await addManager(db, address.data, user.email);
  back(`${address.data} can now manage updates.`);
}

export async function removeManagerAction(form: FormData): Promise<void> {
  await requireManager();
  await removeManager(db, String(form.get("email") ?? ""));
  back("Removed.");
}

export async function confirmAction(form: FormData): Promise<void> {
  const kind = await confirmRecipient(db, String(form.get("token") ?? ""));
  redirect(kind ? `/updates/confirm?done=${encodeURIComponent(kind)}` : "/updates/confirm?unknown=1");
}

export async function stopAction(form: FormData): Promise<void> {
  const kind = await stopRecipient(db, String(form.get("token") ?? ""));
  redirect(kind ? `/updates/stop?done=${encodeURIComponent(kind)}` : "/updates/stop?unknown=1");
}
