import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { storeSettings } from "../db/schema.js";

const SETTINGS_ID = 1;

function serialize(row: typeof storeSettings.$inferSelect) {
  return {
    deliveryFee: Number(row.deliveryFee),
    minOrderAmount: Number(row.minOrderAmount),
    acceptingOrders: row.acceptingOrders,
  };
}

/** The singleton row is normally seeded by db:seed — this only covers a database that hasn't been seeded yet. */
async function getOrCreateSettings() {
  const existing = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, SETTINGS_ID) });
  if (existing) return existing;

  const [created] = await db.insert(storeSettings).values({ id: SETTINGS_ID }).returning();
  return created;
}

export async function adminSettingsRoutes(app: FastifyInstance) {
  // NOTE: intentionally unauthenticated for now — auth is added in a later phase.

  app.get("/settings", async () => {
    return serialize(await getOrCreateSettings());
  });

  app.patch<{ Body: { deliveryFee?: number; minOrderAmount?: number; acceptingOrders?: boolean } }>(
    "/settings",
    {
      schema: {
        body: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: {
            deliveryFee: { type: "number", minimum: 0, maximum: 99999999 },
            minOrderAmount: { type: "number", minimum: 0, maximum: 99999999 },
            acceptingOrders: { type: "boolean" },
          },
        },
      },
    },
    async (request) => {
      await getOrCreateSettings();
      const body = request.body;

      const updates: Partial<typeof storeSettings.$inferInsert> = { updatedAt: new Date() };
      if (body.deliveryFee !== undefined) updates.deliveryFee = body.deliveryFee.toFixed(2);
      if (body.minOrderAmount !== undefined) updates.minOrderAmount = body.minOrderAmount.toFixed(2);
      if (body.acceptingOrders !== undefined) updates.acceptingOrders = body.acceptingOrders;

      const [updated] = await db
        .update(storeSettings)
        .set(updates)
        .where(eq(storeSettings.id, SETTINGS_ID))
        .returning();

      return serialize(updated);
    },
  );
}
