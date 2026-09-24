"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  fetchAdminCategories,
  fetchAdminProducts,
  fetchInventoryItems,
  reorderProducts,
  setProductActive,
  setProductAvailable,
  updateProduct,
  type AdminCategory,
  type AdminProduct,
  type InventoryItem,
  type ProductInput,
} from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import {
  StateToggle,
  Button,
  EmptyState,
  ErrorNotice,
  IconButton,
  PageHeading,
  Panel,
  TableSkeleton,
  fieldInputClass,
  formatPrice,
  tabularNums,
} from "./AdminUI";
import { PriceHistoryModal } from "./PriceHistoryModal";
import { ProductFormModal } from "./ProductFormModal";
import { RecipeModal } from "./RecipeModal";

type LoadState = "loading" | "ready" | "error";
type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; product: AdminProduct }
  | { mode: "history"; product: AdminProduct }
  | { mode: "recipe"; product: AdminProduct };

function moved<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface_container_highest">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt=""
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    </span>
  );
}

export function ProductsTable() {
  const { t, lang } = useAdminLang();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  // Products with an in-flight toggle; their switches are disabled until the
  // backend confirms, so the UI never shows an unsaved state.
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    const [nextProducts, nextCategories, nextInventoryItems] = await Promise.all([
      fetchAdminProducts(),
      fetchAdminCategories(),
      fetchInventoryItems(),
    ]);
    setProducts(nextProducts);
    setCategories(nextCategories);
    setInventoryItems(nextInventoryItems);
  }, []);

  useEffect(() => {
    let cancelled = false;

    load()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : t.common.loadFailed);
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [load, t.common.loadFailed]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name[lang]])),
    [categories, lang],
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
        `${product.name[lang]}: ${error instanceof Error ? error.message : t.common.updateFailed}`,
      );
    } finally {
      setPendingIds((current) => current.filter((id) => id !== product.id));
    }
  }

  // Ordering is per category, so the arrows only appear when the table is
  // filtered to one — "move up" across a category boundary has no meaning.
  const canReorder = categoryFilter !== "all";

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= filteredProducts.length) return;

    const next = moved(filteredProducts, index, target);
    setActionError("");
    setReordering(true);
    try {
      await reorderProducts(
        Number(categoryFilter),
        next.map((product) => product.id),
      );
      // Re-read rather than re-sorting locally, so the table can never drift
      // from the order the database actually holds.
      await load();
    } catch (error: unknown) {
      setActionError(
        `${t.products.title}: ${error instanceof Error ? error.message : t.common.updateFailed}`,
      );
    } finally {
      setReordering(false);
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

  const newButton = (
    <Button variant="primary" onClick={() => setModal({ mode: "create" })}>
      {t.products.newProduct}
    </Button>
  );

  const filterSelect = (
    <select
      value={categoryFilter}
      onChange={(event) => setCategoryFilter(event.target.value)}
      aria-label={t.products.colCategory}
      className={`${fieldInputClass} h-10 w-auto py-0`}
    >
      <option value="all">{t.products.allCategories}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name[lang]}
        </option>
      ))}
    </select>
  );

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.products.title} />
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.products.title} />
        <ErrorNotice>
          {t.common.loadFailed}: {errorMessage}
        </ErrorNotice>
      </div>
    );
  }

  function reorderControls(product: AdminProduct, index: number) {
    return (
      <div className="flex items-center gap-1">
        <IconButton
          disabled={reordering || index === 0}
          onClick={() => handleMove(index, -1)}
          aria-label={t.products.moveUp(product.name[lang])}
        >
          <ArrowUp />
        </IconButton>
        <IconButton
          disabled={reordering || index === filteredProducts.length - 1}
          onClick={() => handleMove(index, 1)}
          aria-label={t.products.moveDown(product.name[lang])}
        >
          <ArrowDown />
        </IconButton>
      </div>
    );
  }

  function activeButton(product: AdminProduct, pending: boolean) {
    return (
      <StateToggle
        tone={product.isActive ? "quiet" : "off"}
        label={product.isActive ? t.products.active : t.products.inactive}
        actionLabel={product.isActive ? t.products.deactivateHint : t.products.activateHint}
        disabled={pending}
        onClick={() => runToggle(product, () => setProductActive(product.id, !product.isActive))}
      />
    );
  }

  function availableButton(product: AdminProduct, pending: boolean) {
    return (
      <StateToggle
        tone={product.isAvailable ? "quiet" : "warn"}
        label={product.isAvailable ? t.products.available : t.products.unavailable}
        actionLabel={product.isAvailable ? t.products.markUnavailable : t.products.markAvailable}
        disabled={pending}
        onClick={() =>
          runToggle(product, () => setProductAvailable(product.id, !product.isAvailable))
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title={`${t.products.title} (${filteredProducts.length})`}
        subtitle={canReorder ? undefined : t.products.reorderHintAll}
        actions={
          <>
            {filterSelect}
            {newButton}
          </>
        }
      />

      {actionError ? <ErrorNotice>{actionError}</ErrorNotice> : null}

      {filteredProducts.length === 0 ? (
        <Panel>
          <EmptyState
            title={t.products.emptyTitle}
            body={t.products.emptyBody}
            action={newButton}
          />
        </Panel>
      ) : (
        <>
          {/* Desktop: a real table, because this is scan-and-compare work. */}
          <Panel className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline_variant bg-surface_container_low/60 text-[0.6875rem] uppercase tracking-wide text-on_surface/50">
                <tr>
                  {canReorder ? <th className="w-24 px-4 py-2.5 font-bold">{t.products.colOrder}</th> : null}
                  <th className="w-16 px-4 py-2.5 font-bold">{t.products.colImage}</th>
                  <th className="px-4 py-2.5 font-bold">{t.products.colName}</th>
                  <th className="px-4 py-2.5 font-bold">{t.products.colCategory}</th>
                  <th className="w-28 px-4 py-2.5 font-bold">{t.products.colPrice}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.products.colActive}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.products.colAvailable}</th>
                  <th className="w-44 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline_variant/70">
                {filteredProducts.map((product, index) => {
                  const pending = pendingIds.includes(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors duration-150 hover:bg-surface_container_low/50 ${
                        product.isActive ? "" : "bg-on_surface/[0.02]"
                      }`}
                    >
                      {canReorder ? (
                        <td className="px-4 py-3">{reorderControls(product, index)}</td>
                      ) : null}
                      <td className="px-4 py-3">
                        <ProductThumb product={product} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-on_surface">{product.name[lang]}</div>
                        <div className="text-[0.75rem] text-on_surface/45">
                          {lang === "tr" ? product.name.en : product.name.tr}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on_surface/65">
                        {categoryNameById.get(product.categoryId) ?? "—"}
                      </td>
                      <td className={`px-4 py-3 font-semibold text-on_surface ${tabularNums}`}>
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">{activeButton(product, pending)}</td>
                      <td className="px-4 py-3">{availableButton(product, pending)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" onClick={() => setModal({ mode: "history", product })}>
                            {t.products.history}
                          </Button>
                          <Button size="sm" onClick={() => setModal({ mode: "recipe", product })}>
                            {t.products.recipe}
                          </Button>
                          <Button size="sm" onClick={() => setModal({ mode: "edit", product })}>
                            {t.products.edit}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* Phone: the sold-out toggle is the job here, so it gets a real target. */}
          <div className="space-y-2.5 md:hidden">
            {filteredProducts.map((product, index) => {
              const pending = pendingIds.includes(product.id);

              return (
                <Panel key={product.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <ProductThumb product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-on_surface">{product.name[lang]}</p>
                      <p className="truncate text-[0.75rem] text-on_surface/45">
                        {categoryNameById.get(product.categoryId) ?? "—"}
                      </p>
                    </div>
                    <p className={`shrink-0 font-bold text-on_surface ${tabularNums}`}>
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {activeButton(product, pending)}
                    {availableButton(product, pending)}
                    {canReorder ? (
                      <div className="ml-auto">{reorderControls(product, index)}</div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-outline_variant pt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setModal({ mode: "history", product })}
                    >
                      {t.products.history}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setModal({ mode: "recipe", product })}
                    >
                      {t.products.recipe}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setModal({ mode: "edit", product })}
                    >
                      {t.products.edit}
                    </Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {modal.mode === "create" || modal.mode === "edit" ? (
        <ProductFormModal
          categories={categories}
          product={modal.mode === "edit" ? modal.product : null}
          onCancel={() => setModal({ mode: "closed" })}
          onSubmit={handleSubmit}
        />
      ) : null}

      {modal.mode === "history" ? (
        <PriceHistoryModal product={modal.product} onClose={() => setModal({ mode: "closed" })} />
      ) : null}

      {modal.mode === "recipe" ? (
        <RecipeModal
          product={modal.product}
          inventoryItems={inventoryItems}
          onClose={() => setModal({ mode: "closed" })}
        />
      ) : null}
    </div>
  );
}
