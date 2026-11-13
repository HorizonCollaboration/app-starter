import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

/*
 * Email updates, fixed by Horizon: don't change this file. Only
 * src/lib/updates.ts uses it. Who gets which updates, what happened, and
 * what was sent, so the people who manage updates can see it all.
 */

/** People the community's owners have let manage this app's email updates. */
export const updateManager = pgTable("update_manager", {
  email: text("email").primaryKey(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Who gets an update: for one kind of event, or "weekly" for the Monday
 * summary. Nothing is sent until they confirm, from an email to that address.
 */
export const updateRecipient = pgTable(
  "update_recipient",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    event: text("event").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    confirmedAt: timestamp("confirmed_at"),
    /** When they were last asked to confirm: once a day at most, per kind. */
    askedAt: timestamp("asked_at"),
    addedBy: text("added_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("update_recipient_email_event").on(table.email, table.event)],
);

/** Something that happened, as the app described it, for the weekly summary. Kept 90 days. */
export const updateEvent = pgTable("update_event", {
  id: text("id").primaryKey(),
  event: text("event").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Every email an update sent, failed to, or held back, and every request to confirm. Kept 90 days. */
export const updateDelivery = pgTable(
  "update_delivery",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    event: text("event").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("update_delivery_event_created_at").on(table.event, table.createdAt), index("update_delivery_email_event").on(table.email, table.event)],
);
