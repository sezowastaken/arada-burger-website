# Project Roadmap

The public website is live on `main`. Everything below is built on the
`feature/admin-backend` branch, which adds the Fastify + Drizzle + PostgreSQL
backend and the `/admin` operations panel.

**Guiding principle:** build the real data sources first, then put the
dashboard on top of them. We do not build an impressive dashboard on fake
data.

**Merge policy:** `main` is production. Nothing merges into it until the whole
stack runs seamlessly locally — see M7 (auth) and M8 (deployment).

---

## Done

- Public website: landing, menu, about, location, bilingual (TR/EN) routing.
- Backend: Fastify + TypeScript, Drizzle ORM, PostgreSQL.
- Schema: `categories`, `products`, `product_price_history`.
- Public API: `GET /api/menu`, `GET /api/products/:slug`.
- Admin API: category list, product list/create/update, active + available
  toggles, automatic price-history recording.
- Admin panel shell at `/admin` with a working Products page.
- Docker Compose stack (`postgres` + `backend` + `frontend`) with automatic
  migrations on backend start and an explicit seed step.

---

## M0 — Technical cleanup (current)

*Goal: documentation reflects reality before we build on top of it.*

- [x] Rewrite `README.md` (it described a Java/Spring + MySQL project).
- [x] Rewrite this roadmap (it described the pre-backend architecture).
- [x] Update `TECHNICAL_STACK.md` to the real stack.
- [x] Fix the stale structure block in `backend/README.md`.
- [x] Update `docs/product/project-scope.md` phase framing.
- [ ] Keep the feature branch committed and pushed regularly.

---

## M1 — Connect the public menu to the database (done)

*Goal: PostgreSQL becomes the single source of truth for the menu.*

- [x] `/tr/menu` and `/en/menu` fetch `GET /api/menu`.
- [x] The homepage "featured products" row reads the same source. It also read
      `menuData.json`, so leaving it behind would have shown one price on the
      homepage and another on `/menu` after any admin edit.
- [x] `menuData.json` is an emergency fallback only.
- [x] API timeout/failure falls back without breaking the page
      (`AbortSignal.timeout`, 2.5s — `fetch` has no default timeout).
- [x] `is_active = false` disappears from the public menu.
- [x] `is_available = false` renders a "TÜKENDİ" / "SOLD OUT" ink stamp, with
      the product shot desaturated and the mustard price pill muted.
- [x] Category names, order and membership now come from the database; the
      mobile category circles key off database slugs and fall back to the
      category's own name instead of rendering blank.
- [x] Verified end to end: price change, product create, deactivate, sold-out
      toggle, and a backend outage.

The `spesiyal-burgerler` question turned out to be moot — no such category
exists in the data; the reference in `menu/page.tsx` was dead code from an
older structure. Categories mapped 1:1 to the five tabs already on the site,
so nothing had to be merged.

**Follow-up carried into M2:** the fallback still serves whatever prices were
last committed to `menuData.json`. With the backend stopped, the menu rendered
a stale ₺600 for a product priced ₺675 in the database, and showed a sold-out
product as available. A `db:export-menu` script that regenerates the JSON from
the database would keep the fallback honest.

---

## M2 — Complete menu management

*Goal: the menu can be fully managed from the admin panel.*

Product create/edit/active/available and price history already work. What is
left:

**2a — remaining CRUD (done)**
- [x] Create/rename/hide categories, on a new `/admin/categories` page.
      New categories start hidden: an active empty category renders a public
      "coming soon" block the moment it is created.
- [x] Reorder products, within one category at a time.
- [x] Reorder categories.
- [x] View price history from the admin panel.

Reordering submits the complete ordered id list for its scope in a single
transaction, and the backend rejects a partial, duplicated or foreign list
rather than leaving rows on stale positions. Hiding a category warns how many
*visible* products it takes off the public menu.

**Open decision — `db:seed` overwrites admin data.** The seed upsert writes
`price` and `sortOrder` back from `menuData.json` (`seed.ts:87`, `:89`), so
re-running it discards every price edit and the whole custom ordering.
`isActive`/`isAvailable` are correctly left alone. Suggested fix: stop writing
those two columns on conflict, making seed a true seed rather than a one-way
sync — at the cost of no longer being able to bulk-update prices from the JSON.

**2b — polish**
- [ ] Real image upload, replacing the manual image-path field.
- [ ] `db:export-menu` script so the emergency fallback is regenerated from the
      database instead of drifting (carried over from M1).
- [ ] Product form UI/UX polish.
- [ ] Run the admin Products page through an Impeccable design pass.

**Public-site defects found during M1** — pre-existing, not caused by the
database migration, and worth fixing in this milestone's polish pass:

- Mobile product titles clip Turkish diacritics. `MobileProductAccordion`'s
  `h3` runs `line-height: 0.92` under `overflow: hidden`, so the dots on `Ö`
  are cut off — "GÖCEK BURGER" renders as "GOCEK BURGER" on a phone. Long
  names also clip horizontally ("MARMARİS" → "MARMARI").
- Desktop product card descriptions are cut off mid-sentence at the bottom of
  the card.
- Nothing in the frontend honours `prefers-reduced-motion`, including the
  framer-motion accordion transitions.

---

## M3 — Analytics / data collection

*Goal: start collecting real traffic data early, so later analysis has
history to work with. A simple event table — not a Google Analytics clone.*

**Schema**
- [ ] `web_sessions`
- [ ] `analytics_events`

**Events**
- [ ] `page_view`, `menu_view`, `product_view`, `product_click`
- [ ] category click, phone click, directions/location click, social/CTA click
- [ ] referrer + UTM, device type

**Admin analytics page**
- [ ] Daily/weekly traffic, unique sessions/visitors
- [ ] Most viewed product, most clicked product, product CTR
- [ ] Traffic sources, desktop/mobile split

**Privacy (decide before writing the schema):** device type, referrer and
session-level click tracking can fall under KVKK. Settle up front that we do
not store raw IP addresses, do not tie the session id to any personal data,
and publish a short privacy note on the site. Changing this after the table
exists is painful.

**Optional early win:** once M3 lands there is enough real data for a small
traffic-only dashboard. Worth half a day to validate the dashboard design
direction without waiting for YepPos.

---

## M4 — Inventory, purchases and waste

*Goal: track what is bought and what is thrown away. Records are entered
whenever shopping actually happens — there is no weekly cycle.*

**Schema**
- [ ] `inventory_items`
- [ ] `inventory_purchases`
- [ ] `inventory_movements`
- [ ] `waste_records`

**Admin**
- [ ] Define an ingredient/item
- [ ] "Add stock" entry: automatic date, quantity + unit + cost
- [ ] Waste entry with reason/note
- [ ] Current stock view
- [ ] Low-stock indicator

---

## M5 — YepPos integration and sales/orders

*Blocked: starts once YepPos provides technical details.*

Build our own source-agnostic model first, so YepPos is just one input:

**Schema**
- [ ] `orders`, `order_items`, `order_payments`, `order_sources`
- [ ] `customers` (only if needed)
- [ ] `integration_sync_logs`

Standard order sources — `WEBSITE` is included from day one so our own online
ordering can be added later without a migration:

```text
TABLE
PHONE
YEMEKSEPETI
TRENDYOL
GETIR
MIGROS
WEBSITE   ← later
```

**Then the integration (read-only one-way if at all possible)**
- [ ] YepPos API + auth
- [ ] Historical order import
- [ ] Sync new/changed orders
- [ ] Cancellations and refunds
- [ ] Payment type, channel
- [ ] Map YepPos items to our `products`
- [ ] Duplicate-order protection

---

## M6 — Dashboard / KPIs and the optimization layer

*Goal: the admin's main screen. This is where we invest the most UI effort,
and it only makes sense once M3 and M5 are feeding it real data.*

**KPIs**
- [ ] Today's revenue, order count, average basket, burgers sold
- [ ] Sales by channel, hourly sales
- [ ] Best sellers, worst sellers
- [ ] Most viewed products
- [ ] High views / low sales (the interesting one)
- [ ] Daily/weekly/monthly comparison
- [ ] Waste quantity and cost, stock spend

**Per-product optimization view** — this is mostly aggregation over data
already collected in M2/M3/M5, which is why it is not a separate milestone:
price history, views, clicks, units sold, revenue, cost (later), sales
channel, day/hour, campaign period. The end result reads like:

```text
Göcek Burger
1.820 views
620 clicks
74 sales
```

---

## M7 — Auth and security

*Mandatory before anything is exposed publicly.*

Admin endpoints are intentionally unauthenticated right now — this is stated
explicitly in `backend/src/routes/admin.ts`. That is acceptable only while the
stack runs locally and nothing is deployed.

- [ ] `/admin/login`
- [ ] Admin user table, password hashing
- [ ] Session/cookie auth
- [ ] Protect `/api/admin/*`
- [ ] Protect `/admin/*` routes
- [ ] Logout
- [ ] Footer "Personel Girişi" → `/admin/login`

A single admin role is enough for v1. Operator/manager/admin style role
systems are company-scale problems we do not have.

---

## M8 — Production / VPS

*Target topology*

```text
aradaburger.com       → Next.js (public site + /admin)
api.aradaburger.com   → Fastify
PostgreSQL            → not exposed to the internet
```

- [ ] VPS provisioning
- [ ] Nginx
- [ ] HTTPS / Let's Encrypt
- [ ] Production `.env`
- [ ] Firewall; PostgreSQL closed to the outside world
- [ ] Database backups
- [ ] Backend restart policy
- [ ] Basic log rotation
- [ ] Health monitoring
- [ ] Final call: frontend on Vercel or on the VPS
- [ ] branch → staging → production merge flow

---

## M9 — Later / optional

Post-MVP, in no particular order:

- Recipe system: one burger → grams of each ingredient
- Theoretical stock deduction from sales
- Theoretical vs. actual stock variance
- CSV/PDF reports
- Meta Ads and Instagram/post performance data
- Customer history / loyalty
- Our own online ordering: cart, payment, `WEBSITE` order source
- Campaigns and coupons

---

## Order of execution

```text
done:             M1  public menu → DB
now:              M2  menu polish → M3 analytics → M4 inventory/waste
when YepPos answers:  M5 orders → M6 dashboard/KPI
before going live:    M7 auth → M8 VPS
```
