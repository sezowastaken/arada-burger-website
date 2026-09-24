"use client";

import { useState } from "react";
import type { InventoryItem } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, FieldError, fieldInputClass, fieldInputErrorClass, fieldLabelClass } from "./AdminUI";

interface Props {
  item: InventoryItem;
  onCancel: () => void;
  onSubmit: (input: { quantity: number; reason: string; note?: string }) => Promise<void>;
}

export function InventoryWasteModal({ item, onCancel, onSubmit }: Props) {
  const { t } = useAdminLang();
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setQuantityError("");
    setReasonError("");

    const parsedQuantity = Number(quantity);
    let hasError = false;
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setQuantityError(t.inventoryWasteForm.errQuantity);
      hasError = true;
    }
    if (!reason.trim()) {
      setReasonError(t.inventoryWasteForm.errReason);
      hasError = true;
    }
    if (hasError) return;

    setSaving(true);
    try {
      await onSubmit({ quantity: parsedQuantity, reason: reason.trim(), note: note.trim() || undefined });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.inventoryWasteForm.errSave);
      setSaving(false);
    }
  }

  return (
    <AdminModal title={t.inventoryWasteForm.title} subtitle={`${item.name} (${item.unit})`} onClose={onCancel} width="sm">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        <div>
          <label className={fieldLabelClass} htmlFor="wasteQuantity">
            {t.inventoryWasteForm.quantity}
          </label>
          <input
            id="wasteQuantity"
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
          {quantityError ? <FieldError id="wasteQuantity-error">{quantityError}</FieldError> : null}
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="wasteReason">
            {t.inventoryWasteForm.reason}
          </label>
          <input
            id="wasteReason"
            className={`${fieldInputClass} ${reasonError ? fieldInputErrorClass : ""}`}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError("");
            }}
            placeholder={t.inventoryWasteForm.reasonPlaceholder}
            aria-invalid={reasonError ? true : undefined}
          />
          {reasonError ? <FieldError id="wasteReason-error">{reasonError}</FieldError> : null}
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="wasteNote">
            {t.inventoryWasteForm.note}
          </label>
          <input id="wasteNote" className={fieldInputClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex justify-end gap-2 border-t border-outline_variant pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t.common.saving : t.inventoryWasteForm.submit}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
