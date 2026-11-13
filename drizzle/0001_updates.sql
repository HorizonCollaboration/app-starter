CREATE TABLE "update_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"event" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_manager" (
	"email" text PRIMARY KEY NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_recipient" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"event" text NOT NULL,
	"token_hash" text NOT NULL,
	"confirmed_at" timestamp,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "update_recipient_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "update_recipient_email_event" UNIQUE("email","event")
);
--> statement-breakpoint
CREATE INDEX "update_delivery_event_created_at" ON "update_delivery" USING btree ("event","created_at");--> statement-breakpoint
CREATE INDEX "update_delivery_email_event" ON "update_delivery" USING btree ("email","event");