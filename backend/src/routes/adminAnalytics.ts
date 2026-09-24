import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, inArray, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/client.js";
import { analyticsEvents, categories, products, webSessions } from "../db/schema.js";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

const querySchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      days: { type: "integer", minimum: 1, maximum: MAX_DAYS },
    },
  },
} as const;

interface AnalyticsQuery {
  days?: number;
}

export async function adminAnalyticsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: AnalyticsQuery }>(
    "/analytics",
    { schema: querySchema },
    async (request) => {
      const days = request.query.days ?? DEFAULT_DAYS;
      const cutoff = sql`now() - ${days} * interval '1 day'`;

      // Everything except the two name lookups below is independent — those
      // alone need the slugs the top-clicked queries return. One Promise.all
      // for all of it means one round trip of query latency per dashboard
      // load instead of two.
      const [
        [{ totalSessions }],
        [{ totalPageViews }],
        [{ directSessions }],
        deviceRows,
        dailyRows,
        referrerRows,
        topProducts,
        topCategories,
      ] = await Promise.all([
        db
          .select({ totalSessions: sql<number>`count(*)::int` })
          .from(webSessions)
          .where(gte(webSessions.firstSeenAt, cutoff)),

        db
          .select({ totalPageViews: sql<number>`count(*)::int` })
          .from(analyticsEvents)
          .where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.occurredAt, cutoff))),

        // Sessions with no referrer at all (typed URL, bookmark, app share) —
        // reported separately so the referrer table doesn't look incomplete
        // next to the session total.
        db
          .select({ directSessions: sql<number>`count(*)::int` })
          .from(webSessions)
          .where(and(gte(webSessions.firstSeenAt, cutoff), isNull(webSessions.referrerHost))),

        db
          .select({
            deviceType: webSessions.deviceType,
            count: sql<number>`count(*)::int`,
          })
          .from(webSessions)
          .where(gte(webSessions.firstSeenAt, cutoff))
          .groupBy(webSessions.deviceType),

        // One row per calendar day so a quiet day still shows as a zero bar
        // instead of a gap the reader has to notice on their own.
        db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${analyticsEvents.occurredAt}), 'YYYY-MM-DD')`,
            sessions: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
            pageViews: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'page_view')::int`,
          })
          .from(analyticsEvents)
          .where(gte(analyticsEvents.occurredAt, cutoff))
          .groupBy(sql`date_trunc('day', ${analyticsEvents.occurredAt})`)
          .orderBy(sql`date_trunc('day', ${analyticsEvents.occurredAt})`),

        db
          .select({
            referrerHost: webSessions.referrerHost,
            count: sql<number>`count(*)::int`,
          })
          .from(webSessions)
          .where(and(gte(webSessions.firstSeenAt, cutoff), isNotNull(webSessions.referrerHost)))
          .groupBy(webSessions.referrerHost)
          .orderBy(desc(sql`count(*)`))
          .limit(10),

        topSlugCounts(analyticsEvents.productSlug, "product_click", cutoff),
        topSlugCounts(analyticsEvents.categorySlug, "category_click", cutoff),
      ]);

      const [productNames, categoryNames] = await Promise.all([
        namesForSlugs(products, topProducts.map((row) => row.slug)),
        namesForSlugs(categories, topCategories.map((row) => row.slug)),
      ]);

      return {
        rangeDays: days,
        totals: { sessions: totalSessions, pageViews: totalPageViews, directSessions },
        deviceSplit: Object.fromEntries(deviceRows.map((row) => [row.deviceType, row.count])),
        daily: zeroFillDays(dailyRows, days),
        topReferrers: referrerRows.map((row) => ({ host: row.referrerHost, sessions: row.count })),
        topProducts: topProducts.map((row) => ({
          slug: row.slug,
          clicks: row.count,
          name: productNames.get(row.slug) ?? null,
        })),
        topCategories: topCategories.map((row) => ({
          slug: row.slug,
          clicks: row.count,
          name: categoryNames.get(row.slug) ?? null,
        })),
      };
    },
  );
}

/**
 * Fills in every day of the range with zero counts, not just the days that
 * had traffic. Without this, a week with one busy day and six quiet ones
 * returns a single row — which a bar chart then has no way to tell apart from
 * a week with one busy day and *no data at all* for the rest of it; both
 * render as one bar claiming the full width. UTC throughout to match
 * Postgres's `date_trunc('day', ...)`, which runs in the session's (UTC,
 * here) timezone.
 */
function zeroFillDays(
  rows: { day: string; sessions: number; pageViews: number }[],
  days: number,
): { day: string; sessions: number; pageViews: number }[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const today = new Date();

  const filled: { day: string; sessions: number; pageViews: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = date.toISOString().slice(0, 10);
    filled.push(byDay.get(key) ?? { day: key, sessions: 0, pageViews: 0 });
  }
  return filled;
}

/** Slug + count for either product_click or category_click, most-clicked first. */
async function topSlugCounts(
  column: PgColumn,
  eventType: "product_click" | "category_click",
  cutoff: SQL,
) {
  return db
    .select({ slug: column, count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(eq(analyticsEvents.eventType, eventType), gte(analyticsEvents.occurredAt, cutoff), isNotNull(column)),
    )
    .groupBy(column)
    .orderBy(desc(sql`count(*)`))
    .limit(10) as Promise<{ slug: string; count: number }[]>;
}

/**
 * A clicked slug can belong to a product or category that has since been
 * renamed or deleted — the event log outlives the catalog row it points to.
 * Missing names are reported as `null` rather than dropping the row, so a
 * deleted item's click history is not silently erased from the report.
 */
async function namesForSlugs(
  table: typeof products | typeof categories,
  slugs: string[],
): Promise<Map<string, { tr: string; en: string }>> {
  if (slugs.length === 0) return new Map();

  const rows = await db
    .select({ slug: table.slug, nameTr: table.nameTr, nameEn: table.nameEn })
    .from(table)
    .where(inArray(table.slug, slugs));

  return new Map(rows.map((row) => [row.slug, { tr: row.nameTr, en: row.nameEn }]));
}
