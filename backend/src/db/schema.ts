import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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
  recipe: many(productRecipes),
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

/**
 * Inventory — M4. Records are entered whenever shopping or waste actually
 * happens; there is no weekly cycle (see docs/product/roadmap.md M4).
 *
 * Current stock is never stored as a column on `inventory_items` — it is
 * always the SUM of `inventory_movements.delta` for that item, computed at
 * read time. A stored running total would drift the moment a write missed
 * updating it; a ledger cannot drift, because there is nothing to keep in
 * sync with it.
 */
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  // Unique so the seed (fixed_starter_items in seed.ts) can be re-run
  // without ever duplicating a row, the same onConflictDoNothing pattern
  // categories/products use on their own slug.
  name: text("name").notNull().unique(),
  // Constrained to INVENTORY_UNITS (see adminInventory.ts) at the API layer,
  // not with a Postgres enum type — changing the allowed set is then a code
  // change, not a migration.
  unit: text("unit").notNull(),
  // Optional purchase-time conversion: some items are bought in a coarser
  // unit than they're tracked/consumed in (1 "baş" of Marul = 20 "adet"
  // leaves; 1 "adet" Domates = 6 "dilim"). Both null, or both set — enforced
  // in adminInventory.ts, not the column type, since a partial pair is a
  // request-validation concern, not a data-shape one. Purely a data-entry
  // convenience for the "Add stock" form: stock, recipes and movements never
  // see this unit, only the item's own `unit`.
  purchaseUnitLabel: text("purchase_unit_label"),
  purchaseUnitFactor: numeric("purchase_unit_factor", { precision: 10, scale: 3 }),
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 3 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryPurchases = pgTable(
  "inventory_purchases",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id),
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
    totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
    note: text("note"),
    // Server clock, like everywhere else records are entered as they happen —
    // never a client-supplied date.
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("inventory_purchases_item_id_idx").on(table.itemId)],
);

export const wasteRecords = pgTable(
  "waste_records",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id),
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("waste_records_item_id_idx").on(table.itemId)],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id),
    // Positive for a purchase, negative for waste — the stock query is a
    // single SUM(delta), no CASE per source type.
    delta: numeric("delta", { precision: 10, scale: 3 }).notNull(),
    sourceType: text("source_type").notNull(), // "purchase" | "waste"
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("inventory_movements_item_id_idx").on(table.itemId)],
);

/**
 * Bill of materials: how much of each inventory item one unit of a product
 * consumes. Defined and edited from the admin panel now, ahead of M5, so the
 * mapping already exists the moment orders can trigger an automatic
 * deduction — this table is the only new work that day.
 */
export const productRecipes = pgTable(
  "product_recipes",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    inventoryItemId: integer("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id),
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("product_recipes_product_item_unique").on(table.productId, table.inventoryItemId)],
);

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  purchases: many(inventoryPurchases),
  wasteRecords: many(wasteRecords),
  movements: many(inventoryMovements),
  recipeUsages: many(productRecipes),
}));

export const inventoryPurchasesRelations = relations(inventoryPurchases, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryPurchases.itemId],
    references: [inventoryItems.id],
  }),
}));

export const wasteRecordsRelations = relations(wasteRecords, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [wasteRecords.itemId],
    references: [inventoryItems.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryMovements.itemId],
    references: [inventoryItems.id],
  }),
}));

export const productRecipesRelations = relations(productRecipes, ({ one }) => ({
  product: one(products, {
    fields: [productRecipes.productId],
    references: [products.id],
  }),
  item: one(inventoryItems, {
    fields: [productRecipes.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

/**
 * Orders — M5. Arada owns this domain outright; YepPos and a payment
 * provider are adapters around it, never the model itself (see
 * docs/product/roadmap.md M5). Nothing here assumes iyzico, PayTR, or
 * YepPos's own shapes — those live in backend/src/payments and, later, a
 * YepPos sync module.
 *
 * `status` carries the full lifecycle, order and payment states interleaved
 * (see ORDER_STATUSES in routes/orders.ts): PENDING_PAYMENT → PAID →
 * CONFIRMED → PREPARING → READY → ON_THE_WAY → DELIVERED, with
 * PAYMENT_FAILED / CANCELLED / REFUND_PENDING / REFUNDED /
 * PARTIALLY_REFUNDED as side branches. Every transition is also appended to
 * `order_status_history` — never just overwritten — so "when did this
 * actually get marked ready" survives past the current state.
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    // Unguessable, unlike the serial id: the public order-status page is
    // keyed on this, not on `id` — an order carries a customer's name, phone
    // and address, and a sequential id would make every other customer's
    // order one increment away.
    publicToken: text("public_token").notNull().unique(),
    // "TABLE" | "PHONE" | "WEBSITE" | "YEMEKSEPETI" | "TRENDYOL" | "GETIR" |
    // "MIGROS" | "OTHER" — WEBSITE is the only source this codebase creates
    // today; the rest exist so a YepPos import lands in the same table
    // without a migration.
    source: text("source").notNull().default("WEBSITE"),
    status: text("status").notNull().default("PENDING_PAYMENT"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    // Snapshots computed server-side at checkout — never trusted from the
    // client — so a later price or delivery-fee change can't retroactively
    // change what an existing order is billed.
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    customerNote: text("customer_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("orders_created_at_idx").on(table.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    // Name and price are copied at order time, not read live off `products`
    // — a later rename or price change must never reach back and rewrite
    // what a past order says it was.
    nameTr: text("name_tr").notNull(),
    nameEn: text("name_en").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

// One row per order (delivery is the only mode this milestone builds — see
// roadmap M5). A separate table rather than columns on `orders` because an
// order without delivery (a future pickup/table mode) shouldn't carry seven
// null address columns, and because saved-address-per-customer is explicit
// future scope (M9) this table is already shaped for.
export const orderAddresses = pgTable("order_addresses", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  // Scoped to Marmaris for now — city is stored rather than hard-coded so a
  // second service area later doesn't need a schema change, just a delivery
  // zone check somewhere upstream of order creation.
  city: text("city").notNull().default("Marmaris"),
  district: text("district").notNull(),
  addressLine: text("address_line").notNull(),
  deliveryNote: text("delivery_note"),
});

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    status: text("status").notNull(),
    note: text("note"),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_status_history_order_id_idx").on(table.orderId)],
);

/**
 * A payment *attempt*, separate from the order's own status: an order can
 * accumulate more than one row here (a failed try, then a successful retry),
 * and this is where the provider's own reference id and raw response live —
 * detail the order itself has no reason to carry.
 */
export const orderPayments = pgTable(
  "order_payments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    // "iyzico" | "paytr" | "manual" ("manual" is the dev/test stand-in used
    // until a real provider is under contract — see backend/src/payments).
    provider: text("provider").notNull(),
    // The provider's own reference for this attempt — null until their
    // initialize call returns one.
    providerPaymentId: text("provider_payment_id"),
    status: text("status").notNull().default("PENDING"), // PENDING | SUCCESS | FAILED | REFUNDED | PARTIALLY_REFUNDED
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    // The provider's raw webhook/response body, as received — kept for
    // support disputes and for re-deriving fields the typed columns above
    // don't happen to cover, without re-calling the provider.
    rawPayload: text("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_payments_order_id_idx").on(table.orderId),
    // A webhook can be delivered more than once (the provider retries on a
    // slow 200); looking an attempt up by (provider, providerPaymentId)
    // before writing is what makes replays a no-op instead of a double-count.
    index("order_payments_provider_payment_id_idx").on(table.provider, table.providerPaymentId),
  ],
);

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  address: one(orderAddresses, {
    fields: [orders.id],
    references: [orderAddresses.orderId],
  }),
  statusHistory: many(orderStatusHistory),
  payments: many(orderPayments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderAddressesRelations = relations(orderAddresses, ({ one }) => ({
  order: one(orders, { fields: [orderAddresses.orderId], references: [orders.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
}));

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, { fields: [orderPayments.orderId], references: [orders.id] }),
}));

/**
 * A singleton row (always id = 1 — enforced in adminSettings.ts, not the
 * column type) rather than env vars, because "sipariş kabulü açık/kapalı"
 * is exactly the kind of thing an owner needs to flip mid-shift, not
 * something that should need a redeploy.
 */
export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("50"),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("350"),
  acceptingOrders: boolean("accepting_orders").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
