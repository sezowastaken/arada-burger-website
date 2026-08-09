import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { products } from "../db/schema.js";

export async function menuRoutes(app: FastifyInstance) {
  app.get("/menu", async () => {
    const activeCategories = await db.query.categories.findMany({
      where: (categories, { eq }) => eq(categories.isActive, true),
      orderBy: (categories, { asc }) => asc(categories.sortOrder),
      with: {
        products: {
          where: (products, { eq }) => eq(products.isActive, true),
          orderBy: (products, { asc }) => asc(products.sortOrder),
        },
      },
    });

    return {
      categories: activeCategories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: { tr: category.nameTr, en: category.nameEn },
        sortOrder: category.sortOrder,
        products: category.products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: { tr: product.nameTr, en: product.nameEn },
          description: { tr: product.descriptionTr, en: product.descriptionEn },
          price: Number(product.price),
          image: product.imagePath,
          isAvailable: product.isAvailable,
          sortOrder: product.sortOrder,
        })),
      })),
    };
  });

  app.get<{ Params: { slug: string } }>("/products/:slug", async (request, reply) => {
    const { slug } = request.params;

    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: { category: true },
    });

    if (!product) {
      return reply.code(404).send({ error: "Product not found" });
    }

    return {
      id: product.id,
      slug: product.slug,
      category: { id: product.category.id, slug: product.category.slug },
      name: { tr: product.nameTr, en: product.nameEn },
      description: { tr: product.descriptionTr, en: product.descriptionEn },
      price: Number(product.price),
      image: product.imagePath,
      isAvailable: product.isAvailable,
    };
  });
}
