import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq } from "drizzle-orm";
import { db, pool } from "./client.js";
import { categories, products } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Regenerates the frontend's emergency fallback menu from the database.
 *
 * `menuData.json` is what the public site renders when the API is unreachable.
 * It used to be hand-maintained, so it drifted: with the backend stopped the
 * site showed ₺600 for a product priced ₺675 and offered a sold-out burger.
 * Running this after menu changes keeps the outage view honest.
 *
 * Host-only — it writes into the frontend source tree, which the backend
 * container does not have. Run it from `backend/` with the database reachable
 * on localhost.
 */
const MENU_DATA_PATH = path.resolve(
  __dirname,
  "../../../frontend/src/constants/menuData.json",
);

async function exportMenu() {
  // Hidden categories and off-menu products are not part of the public menu,
  // so they must not reappear the moment the API goes down.
  const categoryRows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.id));

  const productsByCategory = new Map<number, typeof productRows>();
  for (const product of productRows) {
    const bucket = productsByCategory.get(product.categoryId);
    if (bucket) bucket.push(product);
    else productsByCategory.set(product.categoryId, [product]);
  }

  const menu = {
    categories: categoryRows.map((category) => ({
      id: category.slug,
      name: { tr: category.nameTr, en: category.nameEn },
      items: (productsByCategory.get(category.id) ?? []).map((product) => ({
        id: product.slug,
        name: { tr: product.nameTr, en: product.nameEn },
        price: Number(product.price),
        description: { tr: product.descriptionTr, en: product.descriptionEn },
        image: product.imagePath,
        // Carried so a sold-out product still reads as sold out during an
        // outage, rather than being offered and then refused at the counter.
        isAvailable: product.isAvailable,
      })),
    })),
  };

  const itemCount = menu.categories.reduce((total, c) => total + c.items.length, 0);

  // The file being overwritten is committed to the repository and is what the
  // site falls back to during an outage. Run against a database that has not
  // been migrated or seeded yet, an unguarded export would quietly replace it
  // with an empty menu — and `db:seed` reads this same file, so the content
  // would be gone from both ends.
  if (itemCount === 0) {
    throw new Error(
      "Refusing to export an empty menu: the database has no active products. " +
        "Seed it first (npm run db:seed), or check DATABASE_URL.",
    );
  }

  await writeFile(MENU_DATA_PATH, `${JSON.stringify(menu, null, 2)}\n`, "utf-8");

  console.log(
    `Exported ${menu.categories.length} categories and ${itemCount} products to ${MENU_DATA_PATH}`,
  );
}

exportMenu()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
