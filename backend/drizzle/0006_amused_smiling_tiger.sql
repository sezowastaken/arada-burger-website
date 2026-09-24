CREATE TABLE "store_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '50' NOT NULL,
	"min_order_amount" numeric(10, 2) DEFAULT '350' NOT NULL,
	"accepting_orders" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
