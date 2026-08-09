const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export async function fetchMenu(): Promise<MenuResponse> {
  const res = await fetch(`${API_URL}/api/menu`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch menu (${res.status})`);
  }

  return res.json();
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
