ALTER TABLE "inventory_items" ADD COLUMN "purchase_unit_label" text;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "purchase_unit_factor" numeric(10, 3);