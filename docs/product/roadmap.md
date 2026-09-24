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

## M2 — Complete menu management (done)

*Goal: the menu can be fully managed from the admin panel.*

Product create/edit/active/available and price history already worked when this
milestone opened. What follows is what it added.

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

**Settled — `db:seed` no longer overwrites admin data.** The seed used to
upsert `price` and `sortOrder` from `menuData.json`, so re-running it discarded
every price edit and the whole custom ordering. It is now insert-only: existing
rows are never touched. Bulk-editing prices in the JSON is gone with it, which
is the right trade — the database is the source of truth and `db:export-menu`
now moves data the other way.

**2b — polish (done)**
- [x] Real image upload, replacing the manual image-path field. Files are
      stored by the backend in a Docker volume and served at `/uploads/*`,
      which the frontend proxies so paths stay origin-relative. Format is
      decided by sniffing the leading bytes rather than trusting the browser's
      Content-Type; PNG/JPEG/WEBP up to 5 MB.
- [x] `db:export-menu` script so the emergency fallback is regenerated from the
      database instead of drifting (carried over from M1). It exports only
      active categories and products, and now carries `isAvailable`, so an
      outage can no longer offer something that is sold out.
- [x] Product form UI/UX polish: per-field validation with `aria-invalid` and
      inline messages instead of one notice at the foot of the form, a currency
      prefix inside the price field, the real slug shown when editing, and a
      footer that stacks on a phone.
- [x] Admin design pass (done ahead of this, as a full rebuild of the panel —
      see DESIGN.md §7).

**Public-site defects found during M1 — fixed**

- [x] Mobile product titles clipped Turkish diacritics: `line-height: 0.92`
      under `line-clamp`'s `overflow: hidden` cut the dots off `Ö`, and a long
      single word could not wrap so it lost its last letters. Measured: the ink
      of `Ö` reached 0.10em above the box, so the title now carries
      `pt-[0.12em]`, a 1.05 line height, a viewport-scaled size, and a narrower
      thumbnail below 360px to give the name room.
- [x] Desktop product card descriptions were cut off mid-sentence. The card is
      a fixed 2:3 box with fixed-size contents, so three columns at 1024px left
      each card 194px wide and sliced up to 82px off the longest ingredient
      lists. Three columns now start at `xl`; the tightest case measures 48px
      of clearance.
- [x] Nothing honoured `prefers-reduced-motion`. Handled in two places, because
      CSS media queries do not reach Framer Motion: a reduce block in
      `globals.css` and `<MotionConfig reducedMotion="user">` at the root.
      Loading indicators are exempted — a frozen spinner reads as a crash.

**Found while fixing those:** the root layout declared `lang="en"` on every
page, so CSS uppercasing used English rules on Turkish text — "Marmaris"
rendered as MARMARIS instead of MARMARİS, and the category chips as ILAVE and
IÇECEK. The `[lang]` layout and the admin shell now declare their own language.
`<html lang>` itself still says `en`; fixing that properly means moving the
root layout under the `[lang]` segment, which is an M8-sized change and matters
mainly for SEO.

**Known and accepted:** a very long product name (only "Fuse Tea (Limon,
Şeftali)" today) still truncates with an ellipsis at the two-line clamp on a
phone. That is a designed limit, not a rendering fault — the full name is on
the expanded card.

---

## M3 — Analytics / data collection (done)

*Goal: start collecting real traffic data early, so later analysis has
history to work with. A simple event table — not a Google Analytics clone.*

**Schema**
- [x] `web_sessions` — one row per browser tab, first-touch attribution only.
- [x] `analytics_events` — indexed on `occurred_at` and `(event_type,
      occurred_at)`, since every dashboard query filters on both.

**Events**
- [x] `page_view`, `menu_view`, `category_click`, `product_click`,
      `directions_click`. `phone_click` and `social_click` are wired into the
      ingest schema and the client library but have no UI to fire them yet —
      the site has no phone number or social links to click.
- [x] `product_click` fires on both device shapes now, from two different
      real interactions rather than one invented for the sake of tracking:
      opening a product on the mobile accordion, and — added after the
      desktop gap was flagged — opening the new desktop product image modal
      (see below). `product_view` (a plain impression, no click) was
      considered and deliberately not built: this UI has no product detail
      page and no scroll-based impression tracking, so there was no signal to
      attach it to without adding a mechanism (IntersectionObserver-based
      "visible for N seconds") purely to fill in a roadmap checkbox. Revisit
      if the CTR line below turns out to matter enough to justify it.
- [x] Referrer (hostname only, first-touch) + UTM params + device-type bucket,
      captured once per session, not stored per event.

**Desktop product engagement — closed the gap, with a real feature, not a
tracking shim.** The desktop grid card had no click target at all (M2 already
made it show the full description inline, so there was nothing to "expand"
into). Clicking a card now opens `ProductDetailModal`
(`frontend/src/components/ui/ProductDetailModal.tsx`): the same photo at a
size the 2:3 card can never afford, name/price/description underneath as a
caption. Portaled to `document.body` (several ancestors use `hover:` 
transforms, which would otherwise trap a `position: fixed` overlay), with the
same focus-trap/Escape/scroll-lock shape as `AdminModal`. Used from both the
menu grid and the homepage's featured row, since both render `ProductCard`.

**Admin analytics page**
- [x] Daily trend (sessions + page views), with a 7 / 14 / 30-day range
      toggle. Every day in the selected range is zero-filled server-side
      (`zeroFillDays` in `adminAnalytics.ts`) so a quiet day renders as a
      short bar among many, not — as it first shipped — the range's one real
      day of data stretching to fill the entire chart width. Date labels
      underneath, thinned to roughly ten regardless of range length.
- [x] Most-clicked products and categories, most-clicked first.
- [x] Traffic sources (referrer hostname) plus a separate "direct/unknown"
      count so the table doesn't look incomplete next to the session total.
- [x] Device split (mobile/tablet/desktop).
- [ ] Product CTR (clicks ÷ views) — still not built. `product_click` exists
      on both devices now, but CTR needs a *view* denominator, which this
      milestone still doesn't produce (see the `product_view` note above).

**Privacy — settled, not just decided:**
- No IP address is read or stored anywhere.
- No User-Agent string is stored — only a device-type bucket computed in the
  browser from viewport width.
- `sessionToken` lives in `sessionStorage`, not a cookie: gone the moment the
  tab closes, so it cannot profile a visitor across days.
- `occurredAt` is always the server's clock, never trusts a client-supplied
  timestamp (the ingest endpoint is unauthenticated).
- A short, plain-language privacy note is live at `/[lang]/privacy`, linked
  from the footer next to "Personel Girişi".

**Not built (fair game for M6, since M6 is explicitly the milestone where
this aggregation work belongs):** the "high views / low sales" cross-reference
the user asked about by name needs M5 (orders) to exist first — there is
nothing to compare clicks against yet.

**Found on first real-browser test, not the automated one — took two tries to
fix.** The endpoint was first built at `/api/analytics/events`, called
cross-origin from the browser straight to the backend's own port. Real
browsing recorded zero events even after visiting several pages — the
automated test browser (no extensions) never caught it. First fix: renamed to
`/api/collect` and proxied it through the frontend's own origin (same pattern
as `/uploads`), reasoning that "analytics" in a URL path is what ad-block
filter lists match on. That still got blocked, even same-origin — because
"collect" is Google Analytics's own endpoint convention (`/g/collect`) and is
itself a generic EasyPrivacy-style rule, independent of who is hosting it.
Landed on `/api/relay`, a name with no analytics-vocabulary collision.

This is **not a fully winnable fight**, and no further effort went into
chasing it: filter lists are community-maintained and keep evolving, some of
them work behaviorally rather than by name (an auto-fired, fire-and-forget
POST carrying a random session id *is* a tracking beacon's signature, whatever
it's called), and self-hosted analytics tools with far more engineering behind
them (Plausible, Fathom, Umami) openly accept a real undercount from
privacy-conscious visitors rather than escalate into obfuscated paths or decoy
subdomains — doing that would also sit oddly next to a feature whose entire
pitch is "no personal data, said plainly." The admin analytics page now says
the numbers are approximate for this reason. If a self-hosted event ever goes
missing again, check the browser's Network tab for a request that never left
the tab before assuming the backend is at fault — and check for a browser
extension, not just the built-in tracking-protection setting; Edge's own
panel reporting "Disabled" does not mean nothing else is filtering.

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
done:             M2  menu management complete
done:             M3  analytics / data collection
now:              M4  inventory / purchases / waste
when YepPos answers:  M5 orders → M6 dashboard/KPI
before going live:    M7 auth → M8 VPS
```
