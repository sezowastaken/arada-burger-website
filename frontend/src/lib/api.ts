import fallbackMenu from "@/constants/menuData.json";

// Browser-facing origin: the published port on the host.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Server-side origin. Inside Docker Compose `localhost` is the frontend
// container itself, not the backend, so server rendering must address the
// backend by its service name. Not NEXT_PUBLIC_*, so this is undefined in the
// browser bundle and falls back to the public origin there.
const SERVER_API_URL = process.env.API_INTERNAL_URL ?? API_URL;

// fetch() has no default timeout. Without this, an API that accepts the
// connection but never answers would hang the page render instead of
// falling back to the bundled menu.
const MENU_TIMEOUT_MS = 2500;

export interface LocalizedText {
  tr: string;
  en: string;
}

export interface MenuProduct {
  id: number;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  image: string;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuCategory {
  id: number;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
  products: MenuProduct[];
}

export interface MenuResponse {
  categories: MenuCategory[];
}

export interface MenuResult extends MenuResponse {
  /** "fallback" means the API was unreachable and prices may be stale. */
  source: "api" | "fallback";
}

/**
 * PostgreSQL is the source of truth for the menu; `menuData.json` is only an
 * emergency fallback so the public site keeps rendering if the API is down.
 */
export async function fetchMenu(): Promise<MenuResult> {
  try {
    const res = await fetch(`${SERVER_API_URL}/api/menu`, {
      cache: "no-store",
      signal: AbortSignal.timeout(MENU_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch menu (${res.status})`);
    }

    const data: MenuResponse = await res.json();
    return { categories: data.categories, source: "api" };
  } catch (error) {
    console.error("[menu] API unreachable, serving bundled fallback menu:", error);
    return { categories: fallbackMenuCategories(), source: "fallback" };
  }
}

/**
 * Reshapes the bundled JSON into the API's own shape so callers only ever
 * handle one format. Ids here are positional, not database ids — the JSON has
 * none; `slug` is the stable identifier in both modes.
 *
 * Everything in the file is on the menu by definition: `db:export-menu` writes
 * only active categories and products, so an outage cannot resurrect something
 * that was deliberately taken down.
 */
function fallbackMenuCategories(): MenuCategory[] {
  return fallbackMenu.categories.map((category, categoryIndex) => ({
    id: categoryIndex,
    slug: category.id,
    name: category.name,
    sortOrder: categoryIndex,
    products: category.items.map((item, itemIndex) => ({
      id: itemIndex,
      slug: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image ?? "",
      isActive: true,
      // Carried through so a sold-out burger still reads as sold out during an
      // outage. Older hand-written entries predate the field and default to
      // available, which is how the file behaved before.
      isAvailable: item.isAvailable ?? true,
      sortOrder: itemIndex,
    })),
  }));
}

/* ---------------------------------------------------------------------------
 * Admin API — unlike the public menu above, these include inactive and
 * unavailable products. Unauthenticated for now; auth lands in a later phase.
 * ------------------------------------------------------------------------ */

export interface AdminCategory {
  id: number;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminProduct {
  id: number;
  slug: string;
  categoryId: number;
  category?: AdminCategory;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  image: string;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface ProductInput {
  categoryId: number;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  image: string;
}

export interface PriceHistoryEntry {
  id: number;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
}

export interface PriceHistory {
  productId: number;
  currentPrice: number;
  history: PriceHistoryEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });

  if (!res.ok) {
    // Fastify returns { error, message } for both schema-validation (400) and
    // our own explicit failures — surface whichever is present.
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      detail = body?.message || body?.error || detail;
    } catch {
      // non-JSON body — keep the status text
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const data = await request<{ categories: AdminCategory[] }>("/api/admin/categories");
  return data.categories;
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const data = await request<{ products: AdminProduct[] }>("/api/admin/products");
  return data.products;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const data = await request<{ product: AdminProduct }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.product;
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<AdminProduct> {
  const data = await request<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.product;
}

export async function setProductActive(id: number, isActive: boolean): Promise<AdminProduct> {
  const data = await request<{ product: AdminProduct }>(`/api/admin/products/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  return data.product;
}

export async function setProductAvailable(id: number, isAvailable: boolean): Promise<AdminProduct> {
  const data = await request<{ product: AdminProduct }>(`/api/admin/products/${id}/available`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
  return data.product;
}

export async function fetchPriceHistory(id: number): Promise<PriceHistory> {
  return request<PriceHistory>(`/api/admin/products/${id}/price-history`);
}

/**
 * Reordering submits the complete ordered id list for its scope; the backend
 * rejects a partial list rather than silently leaving rows behind.
 */
export async function reorderProducts(categoryId: number, ids: number[]): Promise<AdminProduct[]> {
  const data = await request<{ products: AdminProduct[] }>("/api/admin/products/reorder", {
    method: "PATCH",
    body: JSON.stringify({ categoryId, ids }),
  });
  return data.products;
}

export async function createCategory(name: LocalizedText): Promise<AdminCategory> {
  const data = await request<{ category: AdminCategory }>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.category;
}

export async function updateCategory(id: number, name: LocalizedText): Promise<AdminCategory> {
  const data = await request<{ category: AdminCategory }>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return data.category;
}

/** Also reports how many products the change pulls from (or returns to) the public menu. */
export async function setCategoryActive(
  id: number,
  isActive: boolean,
): Promise<{ category: AdminCategory; affectedProducts: number }> {
  return request<{ category: AdminCategory; affectedProducts: number }>(
    `/api/admin/categories/${id}/active`,
    { method: "PATCH", body: JSON.stringify({ isActive }) },
  );
}

export async function reorderCategories(ids: number[]): Promise<AdminCategory[]> {
  const data = await request<{ categories: AdminCategory[] }>("/api/admin/categories/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
  return data.categories;
}

/** Mirrors the backend's own limit, so an oversized file is refused before upload. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Uploads a product image and returns the stored path (`/uploads/...`).
 *
 * Deliberately not routed through `request()`: setting Content-Type by hand on
 * a FormData body omits the multipart boundary, and the request is then
 * unparseable at the other end.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${API_URL}/api/admin/uploads`, { method: "POST", body });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const payload = await res.json();
      detail = payload?.message || payload?.error || detail;
    } catch {
      // non-JSON body — keep the status text
    }
    throw new Error(detail);
  }

  const data: { path: string } = await res.json();
  return data.path;
}

/* ---------------------------------------------------------------------------
 * Admin analytics — aggregated reads over the event log recorded by
 * `frontend/src/lib/analytics.ts`. Unauthenticated for now, like the rest of
 * the admin API.
 * ------------------------------------------------------------------------ */

export interface AnalyticsDaily {
  day: string;
  sessions: number;
  pageViews: number;
}

export interface AnalyticsSlugCount {
  slug: string;
  clicks: number;
  /** `null` when the slug no longer matches a product/category row. */
  name: LocalizedText | null;
}

export interface AnalyticsSummary {
  rangeDays: number;
  totals: { sessions: number; pageViews: number; directSessions: number };
  deviceSplit: Partial<Record<"mobile" | "tablet" | "desktop", number>>;
  daily: AnalyticsDaily[];
  topReferrers: { host: string; sessions: number }[];
  topProducts: AnalyticsSlugCount[];
  topCategories: AnalyticsSlugCount[];
}

export async function fetchAdminAnalytics(days: number): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>(`/api/admin/analytics?days=${days}`);
}
