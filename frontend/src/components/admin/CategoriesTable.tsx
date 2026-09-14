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
  tabularNums,
} from "./AdminUI";
import { CategoryFormModal } from "./CategoryFormModal";

type LoadState = "loading" | "ready" | "error";
type ModalState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; category: AdminCategory };

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

export function CategoriesTable() {
  const { t, lang } = useAdminLang();
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
        setErrorMessage(error instanceof Error ? error.message : t.common.loadFailed);
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [load, t.common.loadFailed]);

  /** Only products still on the menu count — a hidden one is not being taken away. */
  const visibleProductCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const product of products) {
      if (!product.isActive) continue;
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
      setActionError(`${label}: ${error instanceof Error ? error.message : t.common.updateFailed}`);
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
    void run(t.categories.title, async () => {
      setCategories(await reorderCategories(next.map((category) => category.id)));
    });
  }

  function handleToggleActive(category: AdminCategory) {
    const count = visibleProductCount.get(category.id) ?? 0;

    if (category.isActive && count > 0) {
      if (!window.confirm(t.categories.hideConfirm(category.name[lang], count))) return;
    }

    void run(category.name[lang], async () => {
      const { category: updated } = await setCategoryActive(category.id, !category.isActive);
      setCategories((current) => current.map((row) => (row.id === updated.id ? updated : row)));
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

  const newButton = (
    <Button variant="primary" onClick={() => setModal({ mode: "create" })}>
      {t.categories.newCategory}
    </Button>
  );

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.categories.title} subtitle={t.categories.subtitle} />
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.categories.title} />
        <ErrorNotice>
          {t.common.loadFailed}: {errorMessage}
        </ErrorNotice>
      </div>
    );
  }

  function reorderControls(category: AdminCategory, index: number) {
    return (
      <div className="flex items-center gap-1">
        <IconButton
          disabled={busy || index === 0}
          onClick={() => handleMove(index, -1)}
          aria-label={t.categories.moveUp(category.name[lang])}
        >
          <ArrowUp />
        </IconButton>
        <IconButton
          disabled={busy || index === categories.length - 1}
          onClick={() => handleMove(index, 1)}
          aria-label={t.categories.moveDown(category.name[lang])}
        >
          <ArrowDown />
        </IconButton>
      </div>
    );
  }

  function visibilityButton(category: AdminCategory) {
    return (
      <StateToggle
        tone={category.isActive ? "quiet" : "warn"}
        label={category.isActive ? t.categories.visible : t.categories.hidden}
        actionLabel={category.isActive ? t.categories.hideHint : t.categories.showHint}
        disabled={busy}
        onClick={() => handleToggleActive(category)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title={`${t.categories.title} (${categories.length})`}
        subtitle={t.categories.subtitle}
        actions={newButton}
      />

      {actionError ? <ErrorNotice>{actionError}</ErrorNotice> : null}

      {categories.length === 0 ? (
        <Panel>
          <EmptyState
            title={t.categories.emptyTitle}
            body={t.categories.emptyBody}
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
                  <th className="w-24 px-4 py-2.5 font-bold">{t.categories.colOrder}</th>
                  <th className="px-4 py-2.5 font-bold">{t.categories.colName}</th>
                  <th className="w-24 px-4 py-2.5 font-bold">{t.categories.colProducts}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.categories.colVisible}</th>
                  <th className="w-32 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline_variant/70">
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={`transition-colors duration-150 hover:bg-surface_container_low/50 ${
                      category.isActive ? "" : "bg-on_surface/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3">{reorderControls(category, index)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-on_surface">{category.name[lang]}</div>
                      <div className="text-[0.75rem] text-on_surface/45">
                        {lang === "tr" ? category.name.en : category.name.tr}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-on_surface/65 ${tabularNums}`}>
                      {visibleProductCount.get(category.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">{visibilityButton(category)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => setModal({ mode: "edit", category })}>
                        {t.categories.rename}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Phone: cards with full-size tap targets instead of a scrolling table. */}
          <div className="space-y-2.5 md:hidden">
            {categories.map((category, index) => (
              <Panel key={category.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on_surface">{category.name[lang]}</p>
                    <p className="truncate text-[0.75rem] text-on_surface/45">
                      {lang === "tr" ? category.name.en : category.name.tr}
                    </p>
                  </div>
                  {reorderControls(category, index)}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {visibilityButton(category)}
                    <span className={`text-[0.75rem] text-on_surface/50 ${tabularNums}`}>
                      {visibleProductCount.get(category.id) ?? 0} {t.categories.colProducts.toLowerCase()}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setModal({ mode: "edit", category })}>
                    {t.categories.rename}
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

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
