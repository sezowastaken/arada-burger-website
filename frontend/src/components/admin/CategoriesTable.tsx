"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  reorderCategories,
  setCategoryActive,
  updateCategory,
  type AdminCategory,
  type AdminProduct,
  type LocalizedText,
} from "@/lib/api";
import { CategoryFormModal } from "./CategoryFormModal";
import { StatusBadge } from "./StatusBadge";

type LoadState = "loading" | "ready" | "error";
type ModalState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; category: AdminCategory };

function moved<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function CategoriesTable() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const load = useCallback(async () => {
    const [nextCategories, nextProducts] = await Promise.all([
      fetchAdminCategories(),
      fetchAdminProducts(),
    ]);
    setCategories(nextCategories);
    setProducts(nextProducts);
  }, []);

  useEffect(() => {
    let cancelled = false;

    load()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load categories");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const productCountByCategory = useMemo(() => {
    const counts = new Map<number, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  async function run(label: string, action: () => Promise<void>) {
    setActionError("");
    setBusy(true);
    try {
      await action();
    } catch (error: unknown) {
      setActionError(`${label}: ${error instanceof Error ? error.message : "Update failed"}`);
    } finally {
      setBusy(false);
    }
  }

  // Each move submits the whole reordered list, so the server never holds a
  // half-applied order and the response is the single source of truth.
  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const next = moved(categories, index, target);
    void run("Reorder", async () => {
      setCategories(await reorderCategories(next.map((category) => category.id)));
    });
  }

  function handleToggleActive(category: AdminCategory) {
    const count = productCountByCategory.get(category.id) ?? 0;

    if (category.isActive && count > 0) {
      const confirmed = window.confirm(
        `Hiding "${category.name.en}" also removes its ${count} product${count === 1 ? "" : "s"} from the public menu.\n\nContinue?`,
      );
      if (!confirmed) return;
    }

    void run(category.name.en, async () => {
      const { category: updated } = await setCategoryActive(category.id, !category.isActive);
      setCategories((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
    });
  }

  async function handleSubmit(name: LocalizedText) {
    if (modal.mode === "edit") {
      const updated = await updateCategory(modal.category.id, name);
      setCategories((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } else {
      const created = await createCategory(name);
      setCategories((current) => [...current, created]);
    }
    setModal({ mode: "closed" });
    setActionError("");
  }

  if (state === "loading") {
    return <p className="text-sm text-slate-500">Loading categories…</p>;
  }

  if (state === "error") {
    return <p className="text-sm text-red-600">Failed to load categories: {errorMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Categories ({categories.length})</h2>
          <p className="text-xs text-slate-500">
            This order is the order customers see on the menu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New category
        </button>
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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">On public menu</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => {
              const count = productCountByCategory.get(category.id) ?? 0;

              return (
                <tr
                  key={category.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    category.isActive ? "" : "bg-slate-50/60"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busy || index === 0}
                        onClick={() => handleMove(index, -1)}
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                        aria-label={`Move ${category.name.en} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={busy || index === categories.length - 1}
                        onClick={() => handleMove(index, 1)}
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                        aria-label={`Move ${category.name.en} down`}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{category.name.en}</div>
                    <div className="text-xs text-slate-500">{category.name.tr}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{count}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggleActive(category)}
                      className="disabled:opacity-50"
                      title={
                        category.isActive
                          ? "Hide this category and its products from the public menu"
                          : "Show this category on the public menu"
                      }
                    >
                      <StatusBadge ok={category.isActive} onLabel="Visible" offLabel="Hidden" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "edit", category })}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Rename
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.mode !== "closed" ? (
        <CategoryFormModal
          category={modal.mode === "edit" ? modal.category : null}
          onCancel={() => setModal({ mode: "closed" })}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
