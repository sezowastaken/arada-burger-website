"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addRecipeRow,
  deleteRecipeRow,
  fetchProductRecipe,
  updateRecipeRow,
  type AdminProduct,
  type InventoryItem,
  type RecipeRow,
} from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, Skeleton, fieldInputClass, tabularNums } from "./AdminUI";

interface Props {
  product: AdminProduct;
  inventoryItems: InventoryItem[];
  onClose: () => void;
}

export function RecipeModal({ product, inventoryItems, onClose }: Props) {
  const { t, lang } = useAdminLang();
  const [rows, setRows] = useState<RecipeRow[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingRowIds, setPendingRowIds] = useState<number[]>([]);

  const [addItemId, setAddItemId] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchProductRecipe(product.id)
      .then((result) => {
        if (!cancelled) setRows(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : t.recipe.loadFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, t.recipe.loadFailed]);

  const activeItems = useMemo(() => inventoryItems.filter((item) => item.isActive), [inventoryItems]);

  const availableItems = useMemo(() => {
    const usedIds = new Set((rows ?? []).map((row) => row.inventoryItemId));
    return activeItems.filter((item) => !usedIds.has(item.id));
  }, [activeItems, rows]);

  useEffect(() => {
    // Keep the select valid as rows are added/removed under it.
    if (addItemId && !availableItems.some((item) => String(item.id) === addItemId)) {
      setAddItemId("");
    }
  }, [availableItems, addItemId]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setActionError("");

    const quantity = Number(addQuantity);
    if (!addItemId || !addQuantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
      setActionError(t.recipe.errQuantity);
      return;
    }

    setAdding(true);
    try {
      const row = await addRecipeRow(product.id, { inventoryItemId: Number(addItemId), quantity });
      setRows((current) => [...(current ?? []), row]);
      setAddItemId("");
      setAddQuantity("");
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : t.recipe.errSave);
    } finally {
      setAdding(false);
    }
  }

  async function handleQuantityChange(row: RecipeRow, value: string) {
    const quantity = Number(value);
    if (!value.trim() || Number.isNaN(quantity) || quantity <= 0) return;
    if (quantity === row.quantity) return;

    setActionError("");
    setPendingRowIds((current) => [...current, row.id]);
    try {
      const updated = await updateRecipeRow(product.id, row.id, quantity);
      setRows((current) => (current ?? []).map((r) => (r.id === row.id ? updated : r)));
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : t.recipe.errSave);
    } finally {
      setPendingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  async function handleRemove(row: RecipeRow) {
    setActionError("");
    setPendingRowIds((current) => [...current, row.id]);
    try {
      await deleteRecipeRow(product.id, row.id);
      setRows((current) => (current ?? []).filter((r) => r.id !== row.id));
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : t.recipe.errSave);
      setPendingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  return (
    <AdminModal title={t.recipe.title} subtitle={`${product.name[lang]} — ${t.recipe.subtitle}`} onClose={onClose}>
      <div className="space-y-4 px-5 py-5">
        {loadError ? <ErrorNotice>{loadError}</ErrorNotice> : null}

        {!loadError && rows === null ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : null}

        {rows && rows.length === 0 ? (
          <p className="rounded-[10px] bg-surface_container_low px-3 py-4 text-sm text-on_surface/55">
            {t.recipe.empty}
          </p>
        ) : null}

        {rows && rows.length > 0 ? (
          <ul className="space-y-1.5">
            {rows.map((row) => {
              const pending = pendingRowIds.includes(row.id);

              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-[10px] border border-outline_variant px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-on_surface">
                    {row.itemName}
                  </span>
                  {/* Fixed-width wrapper, not a width class on the input itself:
                      fieldInputClass already carries `w-full`, and as a direct
                      flex child the input would win the cascade over an
                      appended `w-24` and stretch to fill the row. */}
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0"
                      defaultValue={row.quantity}
                      key={`${row.id}-${row.quantity}`}
                      disabled={pending}
                      onBlur={(event) => void handleQuantityChange(row, event.target.value)}
                      className={`${fieldInputClass} h-9 py-1 text-right ${tabularNums}`}
                      aria-label={`${row.itemName} ${t.recipe.colQuantity}`}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-[0.75rem] text-on_surface/45">{row.unit}</span>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => void handleRemove(row)}>
                    {t.recipe.remove}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {actionError ? <ErrorNotice>{actionError}</ErrorNotice> : null}

        {rows && activeItems.length === 0 ? (
          <p className="text-[0.8125rem] text-on_surface/50">{t.recipe.noItemsAtAll}</p>
        ) : null}

        {rows && activeItems.length > 0 && availableItems.length === 0 ? (
          <p className="text-[0.8125rem] text-on_surface/50">{t.recipe.noItemsLeft}</p>
        ) : null}

        {rows && availableItems.length > 0 ? (
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-t border-outline_variant pt-4">
            <div className="min-w-[10rem] flex-1">
              <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/55">
                {t.recipe.selectItem}
              </label>
              <select
                value={addItemId}
                onChange={(event) => setAddItemId(event.target.value)}
                className={`${fieldInputClass} h-9 py-0`}
              >
                <option value="">—</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/55">
                {t.recipe.quantity}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                value={addQuantity}
                onChange={(event) => setAddQuantity(event.target.value)}
                className={`${fieldInputClass} h-9 py-1 text-right ${tabularNums}`}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" loading={adding}>
              {t.recipe.add}
            </Button>
          </form>
        ) : null}
      </div>
    </AdminModal>
  );
}
