import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import { categories, products } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The customer menu still lives in the frontend; this is the single source of
// truth we seed from, so menu content isn't duplicated into a second file.
const MENU_DATA_PATH = path.resolve(
  __dirname,
  "../../../frontend/src/constants/menuData.json",
);

interface MenuJsonItem {
  id: string;
  name: { tr: string; en: string };
  price: number;
  description: { tr: string; en: string };
  image: string;
}

interface MenuJsonCategory {
  id: string;
  name: { tr: string; en: string };
  items: MenuJsonItem[];
}

interface MenuJson {
  categories: MenuJsonCategory[];
}

async function seed() {
  const raw = await readFile(MENU_DATA_PATH, "utf-8");
  const menu: MenuJson = JSON.parse(raw);

  const categoryRows = menu.categories.map((category, index) => ({
    slug: category.id,
    nameTr: category.name.tr,
    nameEn: category.name.en,
    sortOrder: index,
  }));

  const upsertedCategories = await db
    .insert(categories)
    .values(categoryRows)
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        nameTr: sql`excluded.name_tr`,
        nameEn: sql`excluded.name_en`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIdBySlug = new Map(upsertedCategories.map((c) => [c.slug, c.id]));

  const productRows = menu.categories.flatMap((category) =>
    category.items.map((item, index) => ({
      slug: item.id,
      categoryId: categoryIdBySlug.get(category.id)!,
      nameTr: item.name.tr,
      nameEn: item.name.en,
      descriptionTr: item.description.tr,
      descriptionEn: item.description.en,
      price: item.price.toFixed(2),
      imagePath: item.image,
      sortOrder: index,
    })),
  );

  const upsertedProducts = await db
    .insert(products)
    .values(productRows)
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        categoryId: sql`excluded.category_id`,
        nameTr: sql`excluded.name_tr`,
        nameEn: sql`excluded.name_en`,
        descriptionTr: sql`excluded.description_tr`,
        descriptionEn: sql`excluded.description_en`,
        price: sql`excluded.price`,
        imagePath: sql`excluded.image_path`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: products.id, slug: products.slug });

  console.log(
    `Seeded ${upsertedCategories.length} categories and ${upsertedProducts.length} products from ${MENU_DATA_PATH}`,
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
