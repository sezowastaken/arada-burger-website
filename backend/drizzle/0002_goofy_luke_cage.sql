CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"low_stock_threshold" numeric(10, 3),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"delta" numeric(10, 3) NOT NULL,
	"source_type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"note" text,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_recipes_product_item_unique" UNIQUE("product_id","inventory_item_id")
);
--> statement-breakpoint
CREATE TABLE "waste_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD CONSTRAINT "inventory_purchases_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "inventory_purchases_item_id_idx" ON "inventory_purchases" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "waste_records_item_id_idx" ON "waste_records" USING btree ("item_id");