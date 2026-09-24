CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"path" text NOT NULL,
	"lang" text NOT NULL,
	"product_slug" text,
	"category_slug" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"device_type" text NOT NULL,
	"landing_lang" text NOT NULL,
	"referrer_host" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "web_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_web_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."web_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_type_occurred_at_idx" ON "analytics_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "web_sessions_first_seen_at_idx" ON "web_sessions" USING btree ("first_seen_at");