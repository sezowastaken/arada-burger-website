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

## M4 — Inventory, purchases and waste (done)

*Goal: track what is bought and what is thrown away. Records are entered
whenever shopping actually happens — there is no weekly cycle.*

**Schema**
- [x] `inventory_items` — name (unique, so the seed below can re-run safely),
      unit, optional low-stock threshold, active flag. `unit` is plain
      `text` in the column, but constrained to a fixed set (`kg`, `gram`,
      `litre`, `adet`, `dilim`, `paket`) by both the admin's unit field
      (a `<select>`, not free text) and the API's own JSON-schema `enum` —
      a typo'd unit ("Kg" vs "kg") used to be able to silently split one
      ingredient's stock across two rows that never summed together.
      Two more optional columns, `purchaseUnitLabel` + `purchaseUnitFactor`,
      cover the case where an item is *bought* in a coarser unit than it's
      *tracked* in — see "Purchase-unit conversion" below.
- [x] `inventory_purchases` — quantity, optional unit/total cost, optional
      note, server-clock timestamp.
- [x] `waste_records` — quantity, reason, optional note, server-clock
      timestamp.
- [x] `inventory_movements` — a signed ledger (+delta for a purchase, -delta
      for waste). Current stock is never a stored column on
      `inventory_items`; it is always `SUM(delta)` over this table, computed
      at read time. A stored running total would drift the moment a write
      missed updating it — a ledger cannot drift, because nothing needs to
      stay in sync with it. A purchase/waste row and the movement it produces
      are written in one transaction, so the audit trail (why) and the ledger
      (how much) can never desync.

**Admin (`/admin/inventory`)**
- [x] Define an ingredient/item, edit name/unit/low-stock threshold, and
      deactivate one (hides it from new stock/waste/recipe entry, same
      soft-delete pattern as categories/products — rows are never physically
      deleted so purchase/waste/recipe history survives).
- [x] "Add stock" entry: automatic (server) date, quantity + optional unit
      cost, optional note.
- [x] Waste entry with reason + optional note.
- [x] Current stock view, per item, computed from the movement ledger.
- [x] Low-stock indicator — a mustard "Az stok" badge when stock is below the
      item's own threshold (items without a threshold never show it).
- [x] Movement history per item: a merged, most-recent-first timeline of its
      purchases and waste records.
- [x] A fixed starter list of 16 real kitchen items (bun, patty, cheddar,
      lettuce, pickle relish, onion rings, frankfurter, caramelized onion,
      tomato, mushroom, smoked rib meat, smoked meat, roasted eggplant,
      roasted pepper, chicken, fries), seeded in `db:seed` — insert-only, so
      they're guaranteed present in any environment and a re-run never
      duplicates or resets one an owner has since edited.

**Purchase-unit conversion.** Some items are *bought* in a coarser unit than
they're *tracked and used in* — a head of lettuce yields ~20 leaves, a whole
tomato yields ~6 slices — and forcing the stock unit to match the purchase
unit would make recipes report in heads-of-lettuce-per-burger, which is
useless. An item can now optionally define `purchaseUnitLabel` +
`purchaseUnitFactor` (e.g. "baş", 20) — both or neither, no dangling half. The
"Add stock" form, when an item defines this, shows a small toggle to enter
the purchase either in the item's own unit or in the purchase unit, with a
live "= 60 adet" preview; only the converted, already-in-the-item's-own-unit
number is ever sent to the API and written to the ledger — recipes, stock
and movements never know a purchase unit exists. Unit cost converts the same
way (cost per purchase unit ÷ factor = cost per stock unit), so total spend
is unchanged either way.

**Bill of materials — pulled forward from M9, ahead of schedule.** The user
asked mid-milestone for a way to define which inventory items (and how much
of each) go into a product, specifically so M5's automatic stock deduction on
order completion has something to deduct against. Added as `product_recipes`
(`productId`, `inventoryItemId`, `quantity`, unique per pair) with full CRUD
from a "Recipe" modal on the Products page (add ingredient + quantity, edit
quantity inline, remove a row) — deliberately a separate modal from
`ProductFormModal` rather than folded into it, since editing a recipe only
makes sense for a product that already exists. Quantity is entered in the
ingredient's own unit. **Only the mapping is built here** — nothing consumes
it yet. Automatic deduction needs `order_items` to exist, which is M5's job;
M4's work is what makes that a lookup instead of a new mechanism when M5
arrives.

Every product's recipe is seeded too, read straight off `menuData.json`'s own
descriptions (`db:seed`, insert-only, same as the menu itself) — about 100
rows across 21 products. Deliberately incomplete in two directions: an
ingredient the description mentions that has no match among the 16 starter
items (a sauce, a spice blend, a garnish like "mor soğan") is left out rather
than forced onto the nearest item or turned into a new inventory row —
tracking those would be micromanaging stock for things that don't move the
needle. And "İlave Kuru Et" (Extra Dried Meat) gets no recipe row at all:
none of the 16 items is actually dried meat ("Tütsülenmiş et" is smoked, a
different product), so a forced mapping would just be wrong data — add a
real "Kuru et" item first if this one needs tracking. Quantities are the
owner's own estimate where the description gives no number (a "handful" of
onion rings, a smear of caramelized onion), not measured; edit them from the
Products page once real portions are known.

**Found during the recipe modal's own build, not a pre-existing pattern:** a
row's fixed-width quantity input used `w-24` appended after a shared
`fieldInputClass` that already bakes in `w-full`. Both are "width" utilities
at equal specificity, so Tailwind's fixed utility-generation order (not the
order they're written in the `className` string) decided which one won —
`w-full` did, so the input stretched to fill the row's flex space and pushed
the ingredient's name to a genuine 0px. Fixed by wrapping the input in a
`w-24` div instead of trying to override the width on the input itself —
matching how the "add ingredient" quantity field next to it already did it.

---

## M5 — Ordering, payment infrastructure and YepPos (in progress)

*Guiding principle, carried through every piece of this milestone: **Arada
owns orders, products, payments and operational data; YepPos, iyzico, PayTR
and any other external system are adapters around that core, never the core
itself.** Concretely: nothing in `orders`/`order_items`/`order_payments`
knows what iyzico or YepPos looks like, and none of it changes if either is
swapped out later.*

The milestone splits into two tracks that run in parallel, because most of
it doesn't have to wait on the other:

**Track A — things only the business owner can move forward** (a payment
provider contract, the YepPos technical conversation, legal/fiscal
confirmations — see the working notes below for the exact question list for
each). Nothing here is code, and none of it is blocking Track B.

**Track B — provider-independent technical core**, buildable now regardless
of where Track A stands: our own order domain, a payment-provider interface,
checkout, cart, and the admin surface to see and progress orders. This is
what this session actually built.

### Track A — working notes (for the owner, not code)

**YepPos technical conversation** — needs to answer, in both directions:
- YepPos → Arada: can we pull Yemeksepeti/Trendyol/phone/table orders? Source,
  items, quantity, modifiers, price, discount, payment type? Order status
  changes? Cancellations/refunds? A webhook for new orders, or only polling?
  Bulk historical import?
- Arada → YepPos: can we push our own web orders in as a distinct `WEBSITE`
  source, marked "paid online"? Does that flow into the kitchen/adisyon
  system and generate a fiscal receipt automatically? Does the existing Hızır
  courier integration pick up a web order the same way? Auth model, sandbox,
  and whether API access carries its own cost.
- Also needed: a mali müşavir-confirmed answer to "which payment
  type/operation do we send a pre-paid web order to YepPos as, so the fiscal
  record comes out right?" — not an engineering decision.

**Payment provider** — get hosted-checkout proposals from iyzico and PayTR
(the two named candidates), asking specifically about: commission rate, any
flat per-transaction fee, payout timing, 3D Secure, hosted checkout, webhook
support, sandbox, refunds (full and partial), chargeback process, contract
length/minimum volume, and installment terms if needed. See the API research
below — it's now done regardless of which one is picked, since the
`PaymentProvider` interface doesn't care which adapter implements it.

**Legal/operational, before checkout goes live for real customers:**
business/ETBİS status for online sales, updated KVKK/privacy text, mesafeli
satış (distance-selling) pre-contract terms, cancellation policy, minimum
order amount, delivery zones and fee, order-acceptance hours, which products
are actually deliverable online. Most of these are just `store_settings`
values or copy once decided — the settings screen (below) already has a
place for the numeric ones.

**Hızır courier** stays out of scope entirely: `Arada web order → YepPos →
Hızır` is the whole plan, since Hızır is already reachable through YepPos's
existing integration. No direct Hızır API work is planned.

### Track B — what's built

**Order domain (provider-independent)**
- [x] `orders` — `publicToken` (unguessable, not the serial id — the
      customer-facing order page is keyed on this so one order number isn't
      a browse-away from the next customer's name/phone/address),
      `source` (`WEBSITE` today; `TABLE`/`PHONE`/`YEMEKSEPETI`/`TRENDYOL`/
      `GETIR`/`MIGROS`/`OTHER` reserved so a YepPos import lands in the same
      table with no migration), `status` (the full lifecycle below),
      customer contact, and subtotal/deliveryFee/discount/total —
      always computed server-side at checkout, never trusted from the client.
- [x] `order_items` — a snapshot (name, unit price) at order time, not a
      live read off `products`; a later rename or price change must never
      reach back and rewrite what a past order says it was.
- [x] `order_addresses` — one row per order (delivery is the only mode this
      milestone builds), scoped to Marmaris, shaped so a saved-address-per-
      customer feature (M9) doesn't need a schema change later.
- [x] `order_status_history` — every transition appended, never overwritten,
      so "when did this actually get marked ready" survives past the
      current state.
- [x] `order_payments` — a payment *attempt*, separate from the order's own
      status, since an order can accumulate more than one (a failed try,
      then a successful retry) — this is where a provider's own reference id
      and raw response live.
- [x] `store_settings` — a singleton row (delivery fee, minimum order,
      accepting-orders toggle) rather than env vars: "sipariş kabulü
      açık/kapalı" is exactly the kind of thing an owner flips mid-shift, not
      something that should need a redeploy. Live in the admin `/admin/settings`
      page.

**Status lifecycle** (order and payment state interleaved, matching the plan
above):

```text
PENDING_PAYMENT → PAID → CONFIRMED → PREPARING → READY → ON_THE_WAY → DELIVERED
                     ↘ PAYMENT_FAILED
                                         CANCELLED / REFUND_PENDING / REFUNDED / PARTIALLY_REFUNDED
```

No adjacency is enforced on admin status changes (nothing stops jumping
PREPARING → DELIVERED directly) — the kitchen may need to skip a step the UI
modeled, and a hard state machine that occasionally has to be overridden
anyway is worse than one that trusts the person running the shift. The one
transition that *is* strict: `PAID` is only ever set from a verified payment
result, never from a bare redirect — "the customer's browser came back" is
not the same claim as "the provider confirms this was paid," and only the
second one is trusted (see Payment provider below).

**Payment provider abstraction** (`backend/src/payments/`)
- [x] A provider-agnostic `PaymentProvider` interface — `createCheckout`,
      `verifyReturn`, `getPaymentStatus`, `refund` — shaped around iyzico's
      Checkout Form on purpose, since it needs far more buyer/address detail
      than PayTR does; a PayTR adapter later only has to ignore fields it
      doesn't need, not add new ones to the checkout form.
- [x] `ManualProvider` — the default (`PAYMENT_PROVIDER` unset or
      `manual`) until a real contract exists. Its "checkout URL" is a
      backend route that immediately confirms and redirects back — enough
      to build and test the entire order lifecycle (checkout → "payment" →
      confirm → PAID → admin sees it) without waiting on any sandbox access.
- [x] `IyzicoProvider`, using the official `iyzipay` npm SDK (no TypeScript
      types exist for it — see `src/types/iyzipay.d.ts` — so this leans on
      iyzico's own maintained request-signing rather than a hand-rolled
      HMAC no one here can verify against a live account). Built from the
      Checkout Form API researched directly from iyzico's docs and the SDK's
      own source/tests: initialize request shape, the `paymentPageUrl`
      redirect, and — the part that actually matters for correctness — the
      response-signature algorithm (`HMAC-SHA256` over specific fields
      joined by `:`, with iyzico's own trailing-zero price normalization
      before hashing). **Untested against a real account**: register a free
      sandbox at sandbox-merchant.iyzipay.com, set `IYZICO_API_KEY` /
      `IYZICO_SECRET_KEY` / `IYZICO_URI`, `PAYMENT_PROVIDER=iyzico`, and run
      a full checkout with a published test card before trusting this live.
      One known gap, flagged in the code: iyzico's Checkout Form requires a
      TCKN (`identityNumber`) even for guest checkout, which this sends as
      the placeholder `11111111111` rather than asking a burger customer for
      their national ID — a workaround, not an officially documented one;
      confirm the right approach with iyzico once there's a real account.
- [ ] `PayTRProvider` — not built. Fully researched though (endpoint,
      request/callback field shapes, the *different* field order between the
      two, integer-kuruş vs. decimal-string amount formats depending on the
      endpoint, and that PayTR's sandbox requires an existing merchant
      account — there is no way to test this one before signing, unlike
      iyzico). Add it once a provider is chosen; the interface above already
      doesn't care which.
- [ ] The real asynchronous webhook/IPN path (iyzico's `X-IYZ-SIGNATURE-V3`
      notification, separate from the browser-redirect-then-retrieve flow
      this milestone uses) — not wired up. It needs a callback URL
      registered in iyzico's merchant dashboard, which doesn't exist yet;
      the redirect+retrieve flow that's built is sufficient for correctness
      today (see the PAID-transition note above) but is the single point of
      failure if a customer never gets redirected back. Worth adding once a
      real account exists.

**Checkout flow**
- [x] `POST /api/checkout` — re-reads every product from the database (never
      trusts a client-supplied price or slug), rejects anything inactive or
      unavailable, checks `store_settings.acceptingOrders` and
      `minOrderAmount`, computes delivery fee and total server-side, creates
      the order + items + address in one transaction, then asks the active
      provider for a checkout session.
- [x] `POST /api/payments/confirm` — the single place a `PENDING_PAYMENT`
      order is ever resolved to `PAID` or `PAYMENT_FAILED`, called by the
      frontend's `/payment/return` handler regardless of which provider was
      used. Idempotent — a customer refreshing that page, or a provider
      redirecting the browser back twice, doesn't double-process.
- [x] `GET /api/orders/:token` — public, token-gated order lookup for the
      confirmation page.
- [x] `GET /api/store-settings` — public, deliberately outside `/api/admin`
      so the checkout page keeps working once auth lands on the admin API
      (M7).

**Cart and customer-facing pages**
- [x] Cart is client-side only (`lib/cart.tsx`, `localStorage`) and stores
      *only* `{slug, quantity}` — never a price or name. Every price shown
      anywhere is re-resolved from a fresh menu fetch at render time, the
      same "never trust a stored/client price" rule the checkout endpoint
      itself enforces server-side; a product renamed, repriced, or taken off
      the menu since it was added just falls out of the join instead of
      needing its own stale-data handling.
- [x] "Sepete Ekle" on both the desktop `ProductDetailModal` and the mobile
      `MobileProductAccordion`'s expanded view (not on the collapsed
      card/tile — that still just opens the detail view, same as before;
      adding a second tap target there would have meant nesting a button
      inside the existing card-opens-modal button).
- [x] Cart icon + item-count badge in the header, visible on both mobile and
      desktop.
- [x] `/[lang]/cart` — line items, quantity steppers, subtotal.
- [x] `/[lang]/checkout` — customer name/phone/email, Marmaris delivery
      address (district + open address — no zone/fee lookup, a single flat
      delivery fee from `store_settings`), order summary, minimum-order and
      accepting-orders guards.
- [x] `/[lang]/payment/return` — not a page, a route handler: the literal
      URL a provider redirects the customer's browser to (iyzico sends this
      as a form POST carrying just a `token`; the dev-only `ManualProvider`
      as a plain GET). Its only job is calling `/api/payments/confirm`
      server-side, then forwarding to the real confirmation page. Rebuilds
      its own redirect origin from the request's `Host` header rather than
      Next's `request.url` — inside the standalone Docker build the latter
      resolves to the container's own hostname, not the address the
      browser actually used, which sent the very first end-to-end test
      straight into the Docker network and nowhere the browser could follow.
- [x] `/[lang]/order/[token]` — the persistent order-status page (status
      banner, items, total, delivery address); the id in the URL is the
      unguessable token, not the sequential order id.

**Admin**
- [x] `/admin/orders` — list (order #, source, customer, total, status,
      date) and a detail view (items, address, payments, status history,
      a manual status-advance control). No filters yet (Today/Source/Status
      from the original sketch) — the list is short enough for now that
      scanning it is enough; add filters once order volume makes that untrue.
- [x] `/admin/settings` — delivery fee, minimum order amount, accepting-
      orders toggle, replacing the placeholder.
- [ ] Refund/cancellation UI — the schema (`order_payments.status`,
      `REFUND_PENDING`/`REFUNDED`/`PARTIALLY_REFUNDED` in the status list) is
      ready for it; no admin action triggers a real `provider.refund()` call
      yet.

**Not started**: the YepPos adapter itself (`importOrders`/`sendOrder`/
`syncOrderStatus`), `integration_sync_logs` (the retry/reconciliation table
for "YepPos was down for 30 seconds, don't lose the order"), and the admin
dashboard/KPI layer that reads across orders + M3 analytics + M4 inventory —
that's M6, and explicitly stated there as not making sense until this
milestone is feeding it real data.

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

- Theoretical stock deduction from sales — the recipe system itself
  (`product_recipes`, M4) and `order_items` (M5) both now exist; what's left
  is the order-triggered write against the inventory ledger on a successful
  order, which no code currently does.
- Theoretical vs. actual stock variance
- CSV/PDF reports
- Meta Ads and Instagram/post performance data
- Customer history / loyalty
- Cart, checkout and the `WEBSITE` order source moved to M5, built ahead of
  schedule; still here for M9: saved customer profiles/addresses across
  orders, and a real payment provider actually going live (M5 only built the
  infrastructure — see M5's Track A).
- Campaigns and coupons

---

## Order of execution

```text
done:             M1  public menu → DB
done:             M2  menu management complete
done:             M3  analytics / data collection
done:             M4  inventory / purchases / waste
now:              M5  ordering / payment infra / YepPos — technical core
                      built (order domain, cart, checkout, admin orders);
                      YepPos adapter and a real payment provider both wait
                      on Track A (owner's own conversations — see M5)
when M5's Track A lands: M6 dashboard/KPI
before going live:    M7 auth → M8 VPS
```
