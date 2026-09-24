import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { analyticsEvents, webSessions } from "../db/schema.js";

/**
 * Public event ingest for the site's own first-party analytics.
 *
 * No auth (this is called from every visitor's browser, like the menu API),
 * and deliberately minimal: no IP is read or stored, no User-Agent string is
 * stored, and `occurredAt` is always the server's clock, never the client's —
 * an unauthenticated endpoint cannot be trusted to report its own time.
 *
 * Mounted at `/api/relay`, not `/api/analytics` or `/api/collect`. The first
 * name got caught by ad-block/tracking-protection filter lists that match the
 * word "analytics" in any URL path, origin irrelevant. The second name —
 * chosen specifically to dodge that — got caught anyway, because "collect" is
 * Google Analytics's own endpoint convention (`/g/collect`) and is a generic
 * rule in EasyPrivacy-style lists for exactly that reason, independent of who
 * is hosting it. Same-origin proxying (see `frontend/next.config.mjs`) still
 * matters — it stops cross-origin/third-party heuristics — but the path
 * itself has to avoid analytics vocabulary too: "track", "event", "beacon",
 * "stat", "pixel", "log", "telemetry" are all similarly at risk.
 *
 * This is not a fully winnable fight — filter lists keep evolving, and some
 * fraction of privacy-conscious visitors will always go uncounted. The admin
 * analytics page says so. See `backend/src/db/schema.ts` for the fuller
 * privacy rationale.
 */

const EVENT_TYPES = [
  "page_view",
  "menu_view",
  "product_click",
  "category_click",
  "phone_click",
  "directions_click",
  "social_click",
] as const;

const DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const;
const LANGS = ["tr", "en"] as const;

/** A page can fire more than one event (page_view + menu_view); capped well
 * above any real page so a malformed client can't turn one request into an
 * unbounded insert. */
const MAX_EVENTS_PER_BATCH = 20;

const shortText = { type: "string", minLength: 1, maxLength: 200 } as const;

const eventSchema = {
  type: "object",
  required: ["type", "path", "lang"],
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: EVENT_TYPES },
    path: shortText,
    lang: { type: "string", enum: LANGS },
    productSlug: shortText,
    categorySlug: shortText,
  },
} as const;

const bodySchema = {
  body: {
    type: "object",
    required: ["sessionToken", "device", "lang", "events"],
    additionalProperties: false,
    properties: {
      sessionToken: { type: "string", minLength: 8, maxLength: 100 },
      device: { type: "string", enum: DEVICE_TYPES },
      lang: { type: "string", enum: LANGS },
      referrerHost: shortText,
      utmSource: shortText,
      utmMedium: shortText,
      utmCampaign: shortText,
      events: {
        type: "array",
        minItems: 1,
        maxItems: MAX_EVENTS_PER_BATCH,
        items: eventSchema,
      },
    },
  },
} as const;

interface EventInput {
  type: (typeof EVENT_TYPES)[number];
  path: string;
  lang: (typeof LANGS)[number];
  productSlug?: string;
  categorySlug?: string;
}

interface IngestBody {
  sessionToken: string;
  device: (typeof DEVICE_TYPES)[number];
  lang: (typeof LANGS)[number];
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  events: EventInput[];
}

export async function analyticsRoutes(app: FastifyInstance) {
  app.post<{ Body: IngestBody }>("/", { schema: bodySchema }, async (request, reply) => {
    const body = request.body;

    // Upsert-by-token: the first event of a session creates the row and sets
    // first-touch attribution (referrer, UTM, device, landing language); every
    // later event in the same session only bumps `lastSeenAt`, so a returning
    // visit within the session never overwrites how they originally arrived.
    const [session] = await db
      .insert(webSessions)
      .values({
        sessionToken: body.sessionToken,
        deviceType: body.device,
        landingLang: body.lang,
        referrerHost: body.referrerHost,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      })
      .onConflictDoUpdate({
        target: webSessions.sessionToken,
        set: { lastSeenAt: sql`now()` },
      })
      .returning({ id: webSessions.id });

    await db.insert(analyticsEvents).values(
      body.events.map((event) => ({
        sessionId: session.id,
        eventType: event.type,
        path: event.path,
        lang: event.lang,
        productSlug: event.productSlug,
        categorySlug: event.categorySlug,
      })),
    );

    return reply.status(204).send();
  });
}
