import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { categories, productPriceHistory, products } from "../db/schema.js";

type ProductRow = typeof products.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;

function serializeCategory(category: CategoryRow) {
  return {
    id: category.id,
    slug: category.slug,
    name: { tr: category.nameTr, en: category.nameEn },
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

function serializeProduct(product: ProductRow, category?: CategoryRow) {
  return {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    category: category ? serializeCategory(category) : undefined,
    name: { tr: product.nameTr, en: product.nameEn },
    description: { tr: product.descriptionTr, en: product.descriptionEn },
    price: Number(product.price),
    image: product.imagePath,
    sortOrder: product.sortOrder,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
  };
}

const TURKISH_CHARS: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[çğıöşü]/g, (char) => TURKISH_CHARS[char] ?? char)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const nameField = { type: "string", minLength: 1, maxLength: 200 } as const;
const descriptionField = { type: "string", maxLength: 2000 } as const;
const priceField = { type: "number", minimum: 0, maximum: 99999999 } as const;
const imageField = { type: "string", minLength: 1, maxLength: 500 } as const;

const localizedRequired = {
  type: "object",
  required: ["tr", "en"],
  additionalProperties: false,
  properties: { tr: nameField, en: nameField },
} as const;

const localizedDescription = {
  type: "object",
  additionalProperties: false,
  properties: { tr: descriptionField, en: descriptionField },
} as const;

interface LocalizedInput {
  tr: string;
  en: string;
}

interface CreateProductBody {
  categoryId: number;
  name: LocalizedInput;
  description?: Partial<LocalizedInput>;
  price: number;
  image: string;
  slug?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

interface UpdateProductBody {
  categoryId?: number;
  name?: Partial<LocalizedInput>;
  description?: Partial<LocalizedInput>;
  price?: number;
  image?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

const reorderBodySchema = {
  type: "object",
  required: ["ids"],
  additionalProperties: false,
  properties: {
    ids: {
      type: "array",
      minItems: 1,
      items: { type: "integer", minimum: 1 },
    },
  },
} as const;

/**
 * A reorder must submit the complete set of ids for its scope. Accepting a
 * subset would silently leave the unlisted rows on stale sort_order values and
 * interleave them at arbitrary positions.
 */
function validateReorderIds(submitted: number[], existing: number[]): string | null {
  const unique = new Set(submitted);
  if (unique.size !== submitted.length) {
    return "Reorder list contains duplicate ids";
  }

  const existingSet = new Set(existing);
  const unknown = submitted.filter((id) => !existingSet.has(id));
  if (unknown.length > 0) {
    return `Reorder list contains ids that do not belong here: ${unknown.join(", ")}`;
  }

  const missing = existing.filter((id) => !unique.has(id));
  if (missing.length > 0) {
    return `Reorder list is missing ids: ${missing.join(", ")}`;
  }

  return null;
}

export async function adminRoutes(app: FastifyInstance) {
  // NOTE: intentionally unauthenticated for now — auth is added in a later phase.

  app.get("/categories", async () => {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return { categories: rows.map(serializeCategory) };
  });

  app.post<{ Body: { name: LocalizedInput; slug?: string; isActive?: boolean } }>(
    "/categories",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: {
            name: localizedRequired,
            slug: { type: "string", minLength: 1, maxLength: 200 },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const slug = slugify(body.slug ?? body.name.en);
      if (!slug) {
        return reply.code(400).send({ error: "Could not derive a valid slug from the category name" });
      }

      const existing = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
      if (existing) {
        return reply.code(400).send({ error: `A category with slug "${slug}" already exists` });
      }

      const siblings = await db.select({ sortOrder: categories.sortOrder }).from(categories);
      const nextSortOrder = siblings.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

      const [created] = await db
        .insert(categories)
        .values({
          slug,
          nameTr: body.name.tr,
          nameEn: body.name.en,
          sortOrder: nextSortOrder,
          // Inactive by default: an active empty category renders a public
          // "coming soon" block on the live menu the moment it is created.
          // The owner fills it, then activates it deliberately.
          isActive: body.isActive ?? false,
        })
        .returning();

      return reply.code(201).send({ category: serializeCategory(created) });
    },
  );

  // Registered before "/categories/:id" so the static segment is never read as an id.
  app.patch<{ Body: { ids: number[] } }>(
    "/categories/reorder",
    { schema: { body: reorderBodySchema } },
    async (request, reply) => {
      const { ids } = request.body;

      // Membership is checked inside the transaction so a category created
      // concurrently cannot slip past the completeness check.
      let validationError: string | null = null;
      await db.transaction(async (tx) => {
        const existing = await tx.select({ id: categories.id }).from(categories);
        validationError = validateReorderIds(
          ids,
          existing.map((row) => row.id),
        );
        if (validationError) return;

        for (const [index, id] of ids.entries()) {
          await tx
            .update(categories)
            .set({ sortOrder: index, updatedAt: new Date() })
            .where(eq(categories.id, id));
        }
      });

      if (validationError) {
        return reply.code(400).send({ error: validationError });
      }

      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
      return { categories: rows.map(serializeCategory) };
    },
  );

  app.patch<{ Params: { id: number }; Body: { name?: Partial<LocalizedInput> } }>(
    "/categories/:id",
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
            name: {
              type: "object",
              additionalProperties: false,
              minProperties: 1,
              properties: { tr: nameField, en: nameField },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name } = request.body;

      const updates: Partial<typeof categories.$inferInsert> = { updatedAt: new Date() };
      if (name?.tr !== undefined) updates.nameTr = name.tr;
      if (name?.en !== undefined) updates.nameEn = name.en;

      const [updated] = await db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Category ${id} not found` });
      }

      return { category: serializeCategory(updated) };
    },
  );

  // Deactivating a category also removes every product inside it from the
  // public menu — /api/menu filters on the category's own isActive flag.
  app.patch<{ Params: { id: number }; Body: { isActive: boolean } }>(
    "/categories/:id/active",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
        body: {
          type: "object",
          required: ["isActive"],
          additionalProperties: false,
          properties: { isActive: { type: "boolean" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const [updated] = await db
        .update(categories)
        .set({ isActive: request.body.isActive, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Category ${id} not found` });
      }

      // Only products that were actually reachable on the public menu count as
      // affected — an already-deactivated product is not being taken away.
      const affected = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.categoryId, id), eq(products.isActive, true)));

      return {
        category: serializeCategory(updated),
        affectedProducts: affected.length,
      };
    },
  );

  // Unlike the public /api/menu, this returns every product regardless of
  // isActive/isAvailable so the admin can manage hidden items.
  app.get("/products", async () => {
    const rows = await db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id));

    return { products: rows.map((row) => serializeProduct(row.product, row.category)) };
  });

  app.post<{ Body: CreateProductBody }>(
    "/products",
    {
      schema: {
        body: {
          type: "object",
          required: ["categoryId", "name", "price", "image"],
          additionalProperties: false,
          properties: {
            categoryId: { type: "integer", minimum: 1 },
            name: localizedRequired,
            description: localizedDescription,
            price: priceField,
            image: imageField,
            slug: { type: "string", minLength: 1, maxLength: 200 },
            isActive: { type: "boolean" },
            isAvailable: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, body.categoryId),
      });
      if (!category) {
        return reply.code(400).send({ error: `Category ${body.categoryId} does not exist` });
      }

      const slug = slugify(body.slug ?? body.name.en);
      if (!slug) {
        return reply.code(400).send({ error: "Could not derive a valid slug from the product name" });
      }

      const existing = await db.query.products.findFirst({ where: eq(products.slug, slug) });
      if (existing) {
        return reply.code(400).send({ error: `A product with slug "${slug}" already exists` });
      }

      // Append to the end of its category so it doesn't jump to the top of the menu.
      const siblings = await db
        .select({ sortOrder: products.sortOrder })
        .from(products)
        .where(eq(products.categoryId, body.categoryId));
      const nextSortOrder = siblings.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

      const [created] = await db
        .insert(products)
        .values({
          slug,
          categoryId: body.categoryId,
          nameTr: body.name.tr,
          nameEn: body.name.en,
          descriptionTr: body.description?.tr ?? "",
          descriptionEn: body.description?.en ?? "",
          price: body.price.toFixed(2),
          imagePath: body.image,
          sortOrder: nextSortOrder,
          isActive: body.isActive ?? true,
          isAvailable: body.isAvailable ?? true,
        })
        .returning();

      return reply.code(201).send({ product: serializeProduct(created, category) });
    },
  );

  // Products are ordered within a category, so a reorder is scoped to one.
  // Registered before "/products/:id" so the static segment is never read as an id.
  app.patch<{ Body: { categoryId: number; ids: number[] } }>(
    "/products/reorder",
    {
      schema: {
        body: {
          type: "object",
          required: ["categoryId", "ids"],
          additionalProperties: false,
          properties: {
            categoryId: { type: "integer", minimum: 1 },
            ids: reorderBodySchema.properties.ids,
          },
        },
      },
    },
    async (request, reply) => {
      const { categoryId, ids } = request.body;

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });
      if (!category) {
        return reply.code(400).send({ error: `Category ${categoryId} does not exist` });
      }

      // Membership is checked inside the transaction so a product created or
      // moved into this category concurrently cannot slip past the check.
      let validationError: string | null = null;
      await db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.categoryId, categoryId));

        validationError = validateReorderIds(
          ids,
          existing.map((row) => row.id),
        );
        if (validationError) return;

        for (const [index, id] of ids.entries()) {
          await tx
            .update(products)
            .set({ sortOrder: index, updatedAt: new Date() })
            .where(eq(products.id, id));
        }
      });

      if (validationError) {
        return reply.code(400).send({ error: validationError });
      }

      const rows = await db
        .select({ product: products, category: categories })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.categoryId, categoryId))
        .orderBy(asc(products.sortOrder), asc(products.id));

      return { products: rows.map((row) => serializeProduct(row.product, row.category)) };
    },
  );

  app.get<{ Params: { id: number } }>(
    "/products/:id/price-history",
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

      const product = await db.query.products.findFirst({ where: eq(products.id, id) });
      if (!product) {
        return reply.code(404).send({ error: `Product ${id} not found` });
      }

      const rows = await db
        .select()
        .from(productPriceHistory)
        .where(eq(productPriceHistory.productId, id))
        .orderBy(desc(productPriceHistory.changedAt));

      return {
        productId: id,
        currentPrice: Number(product.price),
        history: rows.map((row) => ({
          id: row.id,
          oldPrice: Number(row.oldPrice),
          newPrice: Number(row.newPrice),
          changedAt: row.changedAt.toISOString(),
        })),
      };
    },
  );

  app.patch<{ Params: { id: number }; Body: UpdateProductBody }>(
    "/products/:id",
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
            categoryId: { type: "integer", minimum: 1 },
            name: {
              type: "object",
              additionalProperties: false,
              minProperties: 1,
              properties: { tr: nameField, en: nameField },
            },
            description: localizedDescription,
            price: priceField,
            image: imageField,
            isActive: { type: "boolean" },
            isAvailable: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
      if (!existing) {
        return reply.code(404).send({ error: `Product ${id} not found` });
      }

      if (body.categoryId !== undefined) {
        const category = await db.query.categories.findFirst({
          where: eq(categories.id, body.categoryId),
        });
        if (!category) {
          return reply.code(400).send({ error: `Category ${body.categoryId} does not exist` });
        }
      }

      const updates: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
      if (body.name?.tr !== undefined) updates.nameTr = body.name.tr;
      if (body.name?.en !== undefined) updates.nameEn = body.name.en;
      if (body.description?.tr !== undefined) updates.descriptionTr = body.description.tr;
      if (body.description?.en !== undefined) updates.descriptionEn = body.description.en;
      if (body.image !== undefined) updates.imagePath = body.image;
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.isAvailable !== undefined) updates.isAvailable = body.isAvailable;

      // A price change must update the product and record history atomically;
      // an unchanged price must not create a history row at all.
      // Compare in the column's own numeric(10,2) string form so 185 and
      // 185.00 aren't treated as a change.
      const newPrice = body.price?.toFixed(2);
      const priceChanged = newPrice !== undefined && newPrice !== existing.price;
      if (newPrice !== undefined) updates.price = newPrice;

      const updated = await db.transaction(async (tx) => {
        const [row] = await tx.update(products).set(updates).where(eq(products.id, id)).returning();

        if (priceChanged) {
          await tx.insert(productPriceHistory).values({
            productId: id,
            oldPrice: existing.price,
            newPrice,
          });
        }

        return row;
      });

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, updated.categoryId),
      });

      return { product: serializeProduct(updated, category), priceHistoryRecorded: priceChanged };
    },
  );

  // Deactivating is how a product is "removed" from the menu — rows are never
  // physically deleted, so price history and future order references survive.
  app.patch<{ Params: { id: number }; Body: { isActive: boolean } }>(
    "/products/:id/active",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
        body: {
          type: "object",
          required: ["isActive"],
          additionalProperties: false,
          properties: { isActive: { type: "boolean" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const [updated] = await db
        .update(products)
        .set({ isActive: request.body.isActive, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Product ${id} not found` });
      }

      return { product: serializeProduct(updated) };
    },
  );

  app.patch<{ Params: { id: number }; Body: { isAvailable: boolean } }>(
    "/products/:id/available",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
        body: {
          type: "object",
          required: ["isAvailable"],
          additionalProperties: false,
          properties: { isAvailable: { type: "boolean" } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const [updated] = await db
        .update(products)
        .set({ isAvailable: request.body.isAvailable, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Product ${id} not found` });
      }

      return { product: serializeProduct(updated) };
    },
  );
}
