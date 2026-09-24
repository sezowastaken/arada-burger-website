"use client";

import { useState } from "react";
import type { InventoryItem } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, FieldError, fieldInputClass, fieldInputErrorClass, fieldLabelClass, tabularNums } from "./AdminUI";

interface Props {
  item: InventoryItem;
  onCancel: () => void;
  onSubmit: (input: { quantity: number; unitCost?: number; note?: string }) => Promise<void>;
}

/** Rounds to the column's own precision (numeric(10,3)) and drops trailing zeros, so 3 * 0.1 previews as "0.3", not "0.30000000000000004". */
function roundToStockPrecision(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function InventoryPurchaseModal({ item, onCancel, onSubmit }: Props) {
  const { t } = useAdminLang();
  // Only relevant when the item defines a coarser purchase unit (see
  // InventoryItemFormModal) — otherwise there is nothing to switch between.
  const hasPurchaseUnit = item.purchaseUnitLabel !== null && item.purchaseUnitFactor !== null;
  const [enteredUnit, setEnteredUnit] = useState<"base" | "purchase">(hasPurchaseUnit ? "purchase" : "base");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [note, setNote] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const factor = item.purchaseUnitFactor ?? 1;
  const inPurchaseUnit = hasPurchaseUnit && enteredUnit === "purchase";
  const activeUnitLabel = inPurchaseUnit ? item.purchaseUnitLabel! : item.unit;

  const parsedQuantity = Number(quantity);
  const validQuantity = quantity.trim() !== "" && !Number.isNaN(parsedQuantity) && parsedQuantity > 0;
  const baseQuantityPreview = inPurchaseUnit && validQuantity ? roundToStockPrecision(parsedQuantity * factor) : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setQuantityError("");

    if (!validQuantity) {
      setQuantityError(t.inventoryPurchaseForm.errQuantity);
      return;
    }

    const parsedUnitCost = unitCost.trim() === "" ? undefined : Number(unitCost);
    // Both convert together: N purchase units of stuff costing X per
    // purchase unit is N*factor base units costing X/factor per base unit —
    // the total spend (N*X) is unchanged either way.
    const baseQuantity = inPurchaseUnit ? roundToStockPrecision(parsedQuantity * factor) : parsedQuantity;
    const baseUnitCost = inPurchaseUnit && parsedUnitCost !== undefined ? parsedUnitCost / factor : parsedUnitCost;

    setSaving(true);
    try {
      await onSubmit({
        quantity: baseQuantity,
        unitCost: baseUnitCost,
        note: note.trim() || undefined,
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.inventoryPurchaseForm.errSave);
      setSaving(false);
    }
  }

  return (
    <AdminModal title={t.inventoryPurchaseForm.title} subtitle={`${item.name} (${item.unit})`} onClose={onCancel} width="sm">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        {hasPurchaseUnit ? (
          <div className="inline-flex items-center rounded-full border border-outline_variant bg-surface_container_lowest p-0.5">
            <Button
              type="button"
              size="sm"
              variant={enteredUnit === "purchase" ? "primary" : "ghost"}
              onClick={() => setEnteredUnit("purchase")}
              className="rounded-full"
            >
              {item.purchaseUnitLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={enteredUnit === "base" ? "primary" : "ghost"}
              onClick={() => setEnteredUnit("base")}
              className="rounded-full"
            >
              {item.unit}
            </Button>
          </div>
        ) : null}

        <div>
          <label className={fieldLabelClass} htmlFor="purchaseQuantity">
            {t.inventoryPurchaseForm.quantity} ({activeUnitLabel})
          </label>
          <input
            id="purchaseQuantity"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            className={`${fieldInputClass} [font-variant-numeric:tabular-nums] ${quantityError ? fieldInputErrorClass : ""}`}
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setQuantityError("");
            }}
            aria-invalid={quantityError ? true : undefined}
            autoFocus
          />
          {quantityError ? (
            <FieldError id="purchaseQuantity-error">{quantityError}</FieldError>
          ) : baseQuantityPreview !== null ? (
            <p className={`mt-1.5 text-[0.75rem] text-on_surface/50 ${tabularNums}`}>
              {t.inventoryPurchaseForm.convertsTo(baseQuantityPreview, item.unit)}
            </p>
          ) : null}
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="purchaseUnitCost">
            {t.inventoryPurchaseForm.unitCost} ({activeUnitLabel})
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-on_surface/40"
            >
              ₺
            </span>
            <input
              id="purchaseUnitCost"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={`${fieldInputClass} pl-7 [font-variant-numeric:tabular-nums]`}
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="purchaseNote">
            {t.inventoryPurchaseForm.note}
          </label>
          <input id="purchaseNote" className={fieldInputClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex justify-end gap-2 border-t border-outline_variant pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t.common.saving : t.inventoryPurchaseForm.submit}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
