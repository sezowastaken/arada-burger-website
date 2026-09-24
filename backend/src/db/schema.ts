import { relations } from "drizzle-orm";
import { boolean, index, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameTr: text("name_tr").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  nameTr: text("name_tr").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionTr: text("description_tr").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imagePath: text("image_path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productPriceHistory = pgTable("product_price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric("new_price", { precision: 10, scale: 2 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  priceHistory: many(productPriceHistory),
}));

export const productPriceHistoryRelations = relations(productPriceHistory, ({ one }) => ({
  product: one(products, {
    fields: [productPriceHistory.productId],
    references: [products.id],
  }),
}));

/**
 * Analytics — a small first-party event log, not a Google Analytics clone.
 *
 * Privacy is designed in, not bolted on (see docs/product/roadmap.md M3):
 * no IP address is ever stored, no raw User-Agent string is stored (only a
 * device-type bucket computed in the browser), and `sessionToken` is a random
 * value generated client-side with no link to any personal identity — there
 * is no login system for it to attach to. `sessionToken` lives in
 * `sessionStorage`, not a persistent cookie, so it does not survive the
 * browser tab closing and cannot be used to profile a visitor across days.
 */
export const webSessions = pgTable(
  "web_sessions",
  {
    id: serial("id").primaryKey(),
    sessionToken: text("session_token").notNull().unique(),
    deviceType: text("device_type").notNull(), // "mobile" | "tablet" | "desktop"
    landingLang: text("landing_lang").notNull(), // "tr" | "en"
    // Hostname only (e.g. "google.com"), never the full referrer URL — a full
    // URL can carry query strings from the referring page that are not ours to
    // store.
    referrerHost: text("referrer_host"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Dashboard queries bucket sessions by "new in the last N days".
  (table) => [index("web_sessions_first_seen_at_idx").on(table.firstSeenAt)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => webSessions.id),
    // "page_view" | "menu_view" | "product_click" | "category_click" |
    // "phone_click" | "directions_click" | "social_click"
    eventType: text("event_type").notNull(),
    path: text("path").notNull(),
    lang: text("lang").notNull(),
    productSlug: text("product_slug"),
    categorySlug: text("category_slug"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Every admin dashboard query filters by a recent date range, and most
    // also filter by event_type within that range (top products, page views).
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_type_occurred_at_idx").on(table.eventType, table.occurredAt),
  ],
);

export const webSessionsRelations = relations(webSessions, ({ many }) => ({
  events: many(analyticsEvents),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  session: one(webSessions, {
    fields: [analyticsEvents.sessionId],
    references: [webSessions.id],
  }),
}));
