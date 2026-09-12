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

## M1 — Connect the public menu to the database (next)

*Goal: PostgreSQL becomes the single source of truth for the menu.*

Today the admin panel reads and writes the database, but `/tr/menu` and
`/en/menu` still render `frontend/src/constants/menuData.json`. This is the
most important gap in the project.

- [ ] `/tr/menu` and `/en/menu` fetch `GET /api/menu`.
- [ ] `menuData.json` becomes an emergency fallback only.
- [ ] Handle API timeout/failure by falling back, without breaking the page.
- [ ] `is_active = false` disappears from the public menu.
- [ ] `is_available = false` renders as "Tükendi" / "Sold Out".
- [ ] Verify: change a price in admin → public menu reflects it.
- [ ] Verify: add a product in admin → it appears on the public menu.

**Open question to settle during M1:** the menu page currently merges the
`et-burgerler` and `spesiyal-burgerler` categories into a single "ET BURGER"
tab in the UI. Either that grouping moves into the data (consolidate the
categories) or the page keeps an explicit display-grouping layer. Decide once,
then the category list is genuinely admin-controlled.

`fetchMenu()` already exists in `frontend/src/lib/api.ts` and is unused — that
is the starting point.

---

## M2 — Complete menu management

*Goal: the menu can be fully managed from the admin panel.*

Product create/edit/active/available and price history already work. What is
left:

**2a — remaining CRUD**
- [ ] Create/edit/deactivate categories.
- [ ] Reorder products.
- [ ] Reorder categories.
- [ ] View price history from the admin panel.

**2b — polish**
- [ ] Real image upload, replacing the manual image-path field.
- [ ] Product form UI/UX polish.
- [ ] Run the admin Products page through an Impeccable design pass.

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
now:              M1  public menu → DB
then:             M2  menu polish → M3 analytics → M4 inventory/waste
when YepPos answers:  M5 orders → M6 dashboard/KPI
before going live:    M7 auth → M8 VPS
```
