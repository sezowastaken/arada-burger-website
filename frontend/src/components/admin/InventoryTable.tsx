"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInventoryItem,
  createInventoryPurchase,
  createInventoryWaste,
  fetchInventoryItems,
  updateInventoryItem,
  type InventoryItem,
  type InventoryItemInput,
} from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import {
  Button,
  EmptyState,
  ErrorNotice,
  PageHeading,
  Panel,
  StateToggle,
  TableSkeleton,
  tabularNums,
} from "./AdminUI";
import { InventoryItemFormModal } from "./InventoryItemFormModal";
import { InventoryMovementsModal } from "./InventoryMovementsModal";
import { InventoryPurchaseModal } from "./InventoryPurchaseModal";
import { InventoryWasteModal } from "./InventoryWasteModal";

type LoadState = "loading" | "ready" | "error";
type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; item: InventoryItem }
  | { mode: "purchase"; item: InventoryItem }
  | { mode: "waste"; item: InventoryItem }
  | { mode: "history"; item: InventoryItem };

/** Trailing zeros are noise in a column you scan — same reasoning as formatPrice in AdminUI. */
function formatStock(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function InventoryTable() {
  const { t } = useAdminLang();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const load = useCallback(async () => {
    setItems(await fetchInventoryItems());
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

  function replaceItem(updated: InventoryItem) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleToggleActive(item: InventoryItem) {
    setActionError("");
    setPendingIds((current) => [...current, item.id]);
    try {
      replaceItem(await updateInventoryItem(item.id, { isActive: !item.isActive }));
    } catch (error: unknown) {
      setActionError(`${item.name}: ${error instanceof Error ? error.message : t.common.updateFailed}`);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function handleItemSubmit(input: InventoryItemInput) {
    if (modal.mode === "edit") {
      replaceItem(await updateInventoryItem(modal.item.id, input));
    } else {
      const created = await createInventoryItem(input);
      setItems((current) => [...current, created]);
    }
    setModal({ mode: "closed" });
    setActionError("");
  }

  async function handlePurchaseSubmit(input: { quantity: number; unitCost?: number; note?: string }) {
    if (modal.mode !== "purchase") return;
    await createInventoryPurchase({ itemId: modal.item.id, ...input });
    setModal({ mode: "closed" });
    setActionError("");
    // Re-read rather than adjusting the number locally, so the table can
    // never drift from the stock the ledger actually sums to.
    await load();
  }

  async function handleWasteSubmit(input: { quantity: number; reason: string; note?: string }) {
    if (modal.mode !== "waste") return;
    await createInventoryWaste({ itemId: modal.item.id, ...input });
    setModal({ mode: "closed" });
    setActionError("");
    await load();
  }

  const newButton = (
    <Button variant="primary" onClick={() => setModal({ mode: "create" })}>
      {t.inventory.newItem}
    </Button>
  );

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.inventory.title} subtitle={t.inventory.subtitle} />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.inventory.title} />
        <ErrorNotice>
          {t.common.loadFailed}: {errorMessage}
        </ErrorNotice>
      </div>
    );
  }

  function statusBadge(item: InventoryItem) {
    return (
      <span
        className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[0.75rem] font-semibold ${
          item.lowStock
            ? "bg-secondary/[0.12] text-secondary ring-1 ring-inset ring-secondary/35"
            : "bg-transparent text-on_surface/55 ring-1 ring-inset ring-outline_variant"
        }`}
      >
        {item.lowStock ? t.inventory.lowStock : t.inventory.ok}
      </span>
    );
  }

  function activeToggle(item: InventoryItem, pending: boolean) {
    return (
      <StateToggle
        tone={item.isActive ? "quiet" : "off"}
        label={item.isActive ? t.inventoryItemForm.active : t.products.inactive}
        actionLabel={item.name}
        disabled={pending}
        onClick={() => handleToggleActive(item)}
      />
    );
  }

  function actionButtons(item: InventoryItem, pending: boolean) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" disabled={pending} onClick={() => setModal({ mode: "purchase", item })}>
          {t.inventory.addStock}
        </Button>
        <Button size="sm" disabled={pending} onClick={() => setModal({ mode: "waste", item })}>
          {t.inventory.addWaste}
        </Button>
        <Button size="sm" disabled={pending} onClick={() => setModal({ mode: "history", item })}>
          {t.inventory.history}
        </Button>
        <Button size="sm" disabled={pending} onClick={() => setModal({ mode: "edit", item })}>
          {t.inventory.edit}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title={`${t.inventory.title} (${items.length})`}
        subtitle={t.inventory.subtitle}
        actions={newButton}
      />

      {actionError ? <ErrorNotice>{actionError}</ErrorNotice> : null}

      {items.length === 0 ? (
        <Panel>
          <EmptyState title={t.inventory.emptyTitle} body={t.inventory.emptyBody} action={newButton} />
        </Panel>
      ) : (
        <>
          {/* Desktop: a real table, because this is scan-and-compare work. */}
          <Panel className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline_variant bg-surface_container_low/60 text-[0.6875rem] uppercase tracking-wide text-on_surface/50">
                <tr>
                  <th className="px-4 py-2.5 font-bold">{t.inventory.colName}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.inventory.colStock}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.inventory.colStatus}</th>
                  <th className="w-32 px-4 py-2.5 font-bold">{t.inventoryItemForm.active}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline_variant/70">
                {items.map((item) => {
                  const pending = pendingIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 hover:bg-surface_container_low/50 ${
                        item.isActive ? "" : "bg-on_surface/[0.02]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-on_surface">{item.name}</div>
                        <div className="text-[0.75rem] text-on_surface/45">{item.unit}</div>
                      </td>
                      <td className={`px-4 py-3 font-semibold text-on_surface ${tabularNums}`}>
                        {formatStock(item.stock)} {item.unit}
                      </td>
                      <td className="px-4 py-3">{statusBadge(item)}</td>
                      <td className="px-4 py-3">{activeToggle(item, pending)}</td>
                      <td className="px-4 py-3">{actionButtons(item, pending)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* Phone: cards, buttons full-width enough to tap without care. */}
          <div className="space-y-2.5 md:hidden">
            {items.map((item) => {
              const pending = pendingIds.includes(item.id);

              return (
                <Panel key={item.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-on_surface">{item.name}</p>
                      <p className="truncate text-[0.75rem] text-on_surface/45">{item.unit}</p>
                    </div>
                    <p className={`shrink-0 font-bold text-on_surface ${tabularNums}`}>
                      {formatStock(item.stock)} {item.unit}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {statusBadge(item)}
                    {activeToggle(item, pending)}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-outline_variant pt-3">
                    <Button size="sm" className="flex-1" disabled={pending} onClick={() => setModal({ mode: "purchase", item })}>
                      {t.inventory.addStock}
                    </Button>
                    <Button size="sm" className="flex-1" disabled={pending} onClick={() => setModal({ mode: "waste", item })}>
                      {t.inventory.addWaste}
                    </Button>
                    <Button size="sm" className="flex-1" disabled={pending} onClick={() => setModal({ mode: "history", item })}>
                      {t.inventory.history}
                    </Button>
                    <Button size="sm" className="flex-1" disabled={pending} onClick={() => setModal({ mode: "edit", item })}>
                      {t.inventory.edit}
                    </Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {modal.mode === "create" || modal.mode === "edit" ? (
        <InventoryItemFormModal
          item={modal.mode === "edit" ? modal.item : null}
          onCancel={() => setModal({ mode: "closed" })}
          onSubmit={handleItemSubmit}
        />
      ) : null}

      {modal.mode === "purchase" ? (
        <InventoryPurchaseModal item={modal.item} onCancel={() => setModal({ mode: "closed" })} onSubmit={handlePurchaseSubmit} />
      ) : null}

      {modal.mode === "waste" ? (
        <InventoryWasteModal item={modal.item} onCancel={() => setModal({ mode: "closed" })} onSubmit={handleWasteSubmit} />
      ) : null}

      {modal.mode === "history" ? (
        <InventoryMovementsModal item={modal.item} onClose={() => setModal({ mode: "closed" })} />
      ) : null}
    </div>
  );
}
