import type { FastifyInstance } from "fastify";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { inventoryItems, inventoryMovements, inventoryPurchases, wasteRecords } from "../db/schema.js";

type InventoryItemRow = typeof inventoryItems.$inferSelect;

/**
 * A fixed set rather than free text — a typo'd unit ("Kg" vs "kg") used to
 * silently split one ingredient's stock across two rows that never sum
 * together. Extending the set is a code change here, not a migration: the
 * column itself is still plain `text`.
 */
export const INVENTORY_UNITS = ["kg", "gram", "litre", "adet", "dilim", "paket"] as const;

function serializeItem(item: InventoryItemRow, stock: number) {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    purchaseUnitLabel: item.purchaseUnitLabel,
    purchaseUnitFactor: item.purchaseUnitFactor === null ? null : Number(item.purchaseUnitFactor),
    lowStockThreshold: item.lowStockThreshold === null ? null : Number(item.lowStockThreshold),
    isActive: item.isActive,
    stock,
    lowStock: item.lowStockThreshold !== null && stock < Number(item.lowStockThreshold),
  };
}

/**
 * The purchase-unit pair is optional, but only as a pair — a label with no
 * factor (or the reverse) can't be converted from, so the "Add stock" form
 * would have no idea what to do with it.
 */
function purchaseUnitPairError(label: string | null | undefined, factor: number | null | undefined): string | null {
  const hasLabel = label !== undefined && label !== null;
  const hasFactor = factor !== undefined && factor !== null;
  if (hasLabel !== hasFactor) {
    return "purchaseUnitLabel and purchaseUnitFactor must be provided together, or not at all";
  }
  return null;
}

const quantityField = { type: "number", exclusiveMinimum: 0, maximum: 999999999 } as const;

type InventoryUnit = (typeof INVENTORY_UNITS)[number];

interface CreateItemBody {
  name: string;
  unit: InventoryUnit;
  purchaseUnitLabel?: string | null;
  purchaseUnitFactor?: number | null;
  lowStockThreshold?: number | null;
}

interface UpdateItemBody {
  name?: string;
  unit?: InventoryUnit;
  purchaseUnitLabel?: string | null;
  purchaseUnitFactor?: number | null;
  lowStockThreshold?: number | null;
  isActive?: boolean;
}

interface CreatePurchaseBody {
  itemId: number;
  quantity: number;
  unitCost?: number;
  note?: string;
}

interface CreateWasteBody {
  itemId: number;
  quantity: number;
  reason: string;
  note?: string;
}

export async function adminInventoryRoutes(app: FastifyInstance) {
  // NOTE: intentionally unauthenticated for now — auth is added in a later phase.

  // Stock is never a stored column — it is always SUM(delta) over the
  // movement ledger, joined here so an item with no movements yet still
  // shows up at 0 rather than being dropped by an inner join.
  app.get("/inventory/items", async () => {
    const rows = await db
      .select({
        item: inventoryItems,
        stock: sql<string>`coalesce(sum(${inventoryMovements.delta}), 0)`,
      })
      .from(inventoryItems)
      .leftJoin(inventoryMovements, eq(inventoryMovements.itemId, inventoryItems.id))
      .groupBy(inventoryItems.id)
      .orderBy(asc(inventoryItems.name));

    return { items: rows.map((row) => serializeItem(row.item, Number(row.stock))) };
  });

  app.post<{ Body: CreateItemBody }>(
    "/inventory/items",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "unit"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            unit: { type: "string", enum: INVENTORY_UNITS },
            purchaseUnitLabel: { type: ["string", "null"], minLength: 1, maxLength: 50 },
            purchaseUnitFactor: { type: ["number", "null"], exclusiveMinimum: 0, maximum: 999999999 },
            lowStockThreshold: { type: ["number", "null"], minimum: 0, maximum: 999999999 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const pairError = purchaseUnitPairError(body.purchaseUnitLabel, body.purchaseUnitFactor);
      if (pairError) {
        return reply.code(400).send({ error: pairError });
      }

      const [created] = await db
        .insert(inventoryItems)
        .values({
          name: body.name.trim(),
          unit: body.unit.trim(),
          purchaseUnitLabel: body.purchaseUnitLabel?.trim() || null,
          purchaseUnitFactor:
            body.purchaseUnitFactor === undefined || body.purchaseUnitFactor === null
              ? null
              : body.purchaseUnitFactor.toString(),
          lowStockThreshold:
            body.lowStockThreshold === undefined || body.lowStockThreshold === null
              ? null
              : body.lowStockThreshold.toString(),
        })
        .returning();

      return reply.code(201).send({ item: serializeItem(created, 0) });
    },
  );

  app.patch<{ Params: { id: number }; Body: UpdateItemBody }>(
    "/inventory/items/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
        body: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            unit: { type: "string", enum: INVENTORY_UNITS },
            purchaseUnitLabel: { type: ["string", "null"], minLength: 1, maxLength: 50 },
            purchaseUnitFactor: { type: ["number", "null"], exclusiveMinimum: 0, maximum: 999999999 },
            lowStockThreshold: { type: ["number", "null"], minimum: 0, maximum: 999999999 },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      // Only checked against what THIS request supplies — the form this API
      // serves always submits the pair together (see InventoryItemFormModal),
      // so this catches a malformed request without needing to reconcile
      // against whatever the row already had.
      const pairError = purchaseUnitPairError(body.purchaseUnitLabel, body.purchaseUnitFactor);
      if (pairError) {
        return reply.code(400).send({ error: pairError });
      }

      const updates: Partial<typeof inventoryItems.$inferInsert> = { updatedAt: new Date() };
      if (body.name !== undefined) updates.name = body.name.trim();
      if (body.unit !== undefined) updates.unit = body.unit.trim();
      if (body.purchaseUnitLabel !== undefined) {
        updates.purchaseUnitLabel = body.purchaseUnitLabel?.trim() || null;
      }
      if (body.purchaseUnitFactor !== undefined) {
        updates.purchaseUnitFactor = body.purchaseUnitFactor === null ? null : body.purchaseUnitFactor.toString();
      }
      if (body.lowStockThreshold !== undefined) {
        updates.lowStockThreshold = body.lowStockThreshold === null ? null : body.lowStockThreshold.toString();
      }
      if (body.isActive !== undefined) updates.isActive = body.isActive;

      const [updated] = await db
        .update(inventoryItems)
        .set(updates)
        .where(eq(inventoryItems.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Inventory item ${id} not found` });
      }

      const [stockRow] = await db
        .select({ stock: sql<string>`coalesce(sum(${inventoryMovements.delta}), 0)` })
        .from(inventoryMovements)
        .where(eq(inventoryMovements.itemId, id));

      return { item: serializeItem(updated, Number(stockRow?.stock ?? 0)) };
    },
  );

  // A purchase and the movement it produces are written together — a
  // purchase row without its movement (or the reverse) would silently
  // desync the stock ledger from the audit trail that explains it.
  app.post<{ Body: CreatePurchaseBody }>(
    "/inventory/purchases",
    {
      schema: {
        body: {
          type: "object",
          required: ["itemId", "quantity"],
          additionalProperties: false,
          properties: {
            itemId: { type: "integer", minimum: 1 },
            quantity: quantityField,
            unitCost: { type: "number", minimum: 0, maximum: 99999999 },
            note: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const item = await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, body.itemId) });
      if (!item) {
        return reply.code(400).send({ error: `Inventory item ${body.itemId} does not exist` });
      }

      const unitCost = body.unitCost;
      const totalCost = unitCost === undefined ? undefined : unitCost * body.quantity;

      const created = await db.transaction(async (tx) => {
        const [purchase] = await tx
          .insert(inventoryPurchases)
          .values({
            itemId: body.itemId,
            quantity: body.quantity.toString(),
            unitCost: unitCost === undefined ? undefined : unitCost.toFixed(2),
            totalCost: totalCost === undefined ? undefined : totalCost.toFixed(2),
            note: body.note?.trim() || undefined,
          })
          .returning();

        await tx.insert(inventoryMovements).values({
          itemId: body.itemId,
          delta: body.quantity.toString(),
          sourceType: "purchase",
          occurredAt: purchase.purchasedAt,
        });

        return purchase;
      });

      return reply.code(201).send({
        purchase: {
          id: created.id,
          itemId: created.itemId,
          quantity: Number(created.quantity),
          unitCost: created.unitCost === null ? null : Number(created.unitCost),
          totalCost: created.totalCost === null ? null : Number(created.totalCost),
          note: created.note,
          purchasedAt: created.purchasedAt.toISOString(),
        },
      });
    },
  );

  app.post<{ Body: CreateWasteBody }>(
    "/inventory/waste",
    {
      schema: {
        body: {
          type: "object",
          required: ["itemId", "quantity", "reason"],
          additionalProperties: false,
          properties: {
            itemId: { type: "integer", minimum: 1 },
            quantity: quantityField,
            reason: { type: "string", minLength: 1, maxLength: 200 },
            note: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const item = await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, body.itemId) });
      if (!item) {
        return reply.code(400).send({ error: `Inventory item ${body.itemId} does not exist` });
      }

      const created = await db.transaction(async (tx) => {
        const [waste] = await tx
          .insert(wasteRecords)
          .values({
            itemId: body.itemId,
            quantity: body.quantity.toString(),
            reason: body.reason.trim(),
            note: body.note?.trim() || undefined,
          })
          .returning();

        await tx.insert(inventoryMovements).values({
          itemId: body.itemId,
          delta: (-body.quantity).toString(),
          sourceType: "waste",
          occurredAt: waste.occurredAt,
        });

        return waste;
      });

      return reply.code(201).send({
        waste: {
          id: created.id,
          itemId: created.itemId,
          quantity: Number(created.quantity),
          reason: created.reason,
          note: created.note,
          occurredAt: created.occurredAt.toISOString(),
        },
      });
    },
  );

  // A merged, most-recent-first timeline for one item's card — reading two
  // small tables and merging in memory is simpler than a UNION query for
  // rows that are only ever fetched a page at a time.
  app.get<{ Params: { id: number } }>(
    "/inventory/items/:id/movements",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const item = await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, id) });
      if (!item) {
        return reply.code(404).send({ error: `Inventory item ${id} not found` });
      }

      const [purchases, waste] = await Promise.all([
        db
          .select()
          .from(inventoryPurchases)
          .where(eq(inventoryPurchases.itemId, id))
          .orderBy(desc(inventoryPurchases.purchasedAt)),
        db.select().from(wasteRecords).where(eq(wasteRecords.itemId, id)).orderBy(desc(wasteRecords.occurredAt)),
      ]);

      const entries = [
        ...purchases.map((row) => ({
          id: `purchase-${row.id}`,
          type: "purchase" as const,
          quantity: Number(row.quantity),
          unitCost: row.unitCost === null ? null : Number(row.unitCost),
          totalCost: row.totalCost === null ? null : Number(row.totalCost),
          reason: null,
          note: row.note,
          occurredAt: row.purchasedAt.toISOString(),
        })),
        ...waste.map((row) => ({
          id: `waste-${row.id}`,
          type: "waste" as const,
          quantity: Number(row.quantity),
          unitCost: null,
          totalCost: null,
          reason: row.reason,
          note: row.note,
          occurredAt: row.occurredAt.toISOString(),
        })),
      ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

      return { itemId: id, entries };
    },
  );
}
