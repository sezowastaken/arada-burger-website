"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  fetchAdminCategories,
  fetchAdminProducts,
  setProductActive,
  setProductAvailable,
  updateProduct,
  type AdminCategory,
  type AdminProduct,
  type ProductInput,
} from "@/lib/api";
import { ProductFormModal } from "./ProductFormModal";
import { StatusBadge } from "./StatusBadge";

type LoadState = "loading" | "ready" | "error";
type ModalState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; product: AdminProduct };

export function ProductsTable() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  // Products with an in-flight toggle; their switches are disabled until the
  // backend confirms, so the UI never shows an unsaved state.
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    const [nextProducts, nextCategories] = await Promise.all([
      fetchAdminProducts(),
      fetchAdminCategories(),
    ]);
    setProducts(nextProducts);
    setCategories(nextCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;

    load()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load products");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name.en])),
    [categories],
  );

  const filteredProducts = useMemo(
    () =>
      categoryFilter === "all"
        ? products
        : products.filter((product) => String(product.categoryId) === categoryFilter),
    [products, categoryFilter],
  );

  function replaceProduct(updated: AdminProduct) {
    setProducts((current) =>
      current.map((product) => (product.id === updated.id ? { ...product, ...updated } : product)),
    );
  }

  async function runToggle(product: AdminProduct, action: () => Promise<AdminProduct>) {
    setActionError("");
    setPendingIds((current) => [...current, product.id]);
    try {
      // State is only updated from the server's response — on failure the row
      // keeps its previous value and the error is surfaced above the table.
      replaceProduct(await action());
    } catch (error: unknown) {
      setActionError(
        `${product.name.en}: ${error instanceof Error ? error.message : "Update failed"}`,
      );
    } finally {
      setPendingIds((current) => current.filter((id) => id !== product.id));
    }
  }

  async function handleSubmit(input: ProductInput) {
    if (modal.mode === "edit") {
      replaceProduct(await updateProduct(modal.product.id, input));
    } else {
      const created = await createProduct(input);
      setProducts((current) => [...current, created]);
    }
    setModal({ mode: "closed" });
    setActionError("");
  }

  if (state === "loading") {
    return <p className="text-sm text-slate-500">Loading products…</p>;
  }

  if (state === "error") {
    return <p className="text-sm text-red-600">Failed to load products: {errorMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Products ({filteredProducts.length})</h2>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.en}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            New product
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const pending = pendingIds.includes(product.id);

              return (
                <tr
                  key={product.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    product.isActive ? "" : "bg-slate-50/60"
                  }`}
                >
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name.en}
                      className="h-10 w-10 rounded object-cover"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{product.name.en}</div>
                    <div className="text-xs text-slate-500">{product.name.tr}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {categoryNameById.get(product.categoryId) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">₺{product.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        runToggle(product, () => setProductActive(product.id, !product.isActive))
                      }
                      className="disabled:opacity-50"
                      title={product.isActive ? "Deactivate (hides from public menu)" : "Activate"}
                    >
                      <StatusBadge ok={product.isActive} onLabel="Active" offLabel="Inactive" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        runToggle(product, () =>
                          setProductAvailable(product.id, !product.isAvailable),
                        )
                      }
                      className="disabled:opacity-50"
                      title={product.isAvailable ? "Mark unavailable" : "Mark available"}
                    >
                      <StatusBadge
                        ok={product.isAvailable}
                        onLabel="Available"
                        offLabel="Unavailable"
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "edit", product })}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.mode !== "closed" ? (
        <ProductFormModal
          categories={categories}
          product={modal.mode === "edit" ? modal.product : null}
          onCancel={() => setModal({ mode: "closed" })}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
