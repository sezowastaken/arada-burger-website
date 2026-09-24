"use client";

import { useEffect, useState } from "react";
import type { InventoryItem, InventoryItemInput } from "@/lib/api";
import { INVENTORY_UNITS, type InventoryUnit } from "@/lib/inventoryUnits";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import {
  Button,
  ErrorNotice,
  FieldError,
  fieldInputClass,
  fieldInputErrorClass,
  fieldLabelClass,
} from "./AdminUI";

interface Props {
  /** Editing an existing item, or null when creating a new one. */
  item: InventoryItem | null;
  onCancel: () => void;
  onSubmit: (input: InventoryItemInput) => Promise<void>;
}

interface FormState {
  name: string;
  unit: InventoryUnit;
  purchaseUnitLabel: string;
  purchaseUnitFactor: string;
  lowStockThreshold: string;
}

type FieldErrors = Partial<Record<"name" | "purchaseUnit", string>>;

function initialState(item: InventoryItem | null): FormState {
  return {
    name: item?.name ?? "",
    // Falls back to the first option rather than requiring a choice — a
    // select can never be left genuinely empty the way a text field could.
    unit: (item?.unit as InventoryUnit) ?? INVENTORY_UNITS[0],
    purchaseUnitLabel: item?.purchaseUnitLabel ?? "",
    purchaseUnitFactor: item?.purchaseUnitFactor === null || item?.purchaseUnitFactor === undefined
      ? ""
      : String(item.purchaseUnitFactor),
    lowStockThreshold: item?.lowStockThreshold === null || item?.lowStockThreshold === undefined
      ? ""
      : String(item.lowStockThreshold),
  };
}

export function InventoryItemFormModal({ item, onCancel, onSubmit }: Props) {
  const { t } = useAdminLang();
  const [form, setForm] = useState<FormState>(() => initialState(item));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialState(item));
    setFieldErrors({});
    setError("");
  }, [item]);

  const update =
    (field: "name" | "purchaseUnitLabel" | "purchaseUnitFactor" | "lowStockThreshold") =>
    (event: { target: { value: string } }) => {
      const { value } = event.target;
      setForm((current) => ({ ...current, [field]: value }));
      if (field === "name" || field === "purchaseUnitLabel" || field === "purchaseUnitFactor") {
        setFieldErrors((current) => {
          const key = field === "name" ? "name" : "purchaseUnit";
          if (!current[key]) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      }
    };

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = t.inventoryItemForm.errName;

    // A label with no factor (or the reverse) has nothing to compute — the
    // "Add stock" form needs both or neither.
    const hasLabel = form.purchaseUnitLabel.trim() !== "";
    const hasFactor = form.purchaseUnitFactor.trim() !== "";
    if (hasLabel !== hasFactor) {
      errors.purchaseUnit = t.inventoryItemForm.errPurchaseUnitPair;
    } else if (hasFactor && (Number.isNaN(Number(form.purchaseUnitFactor)) || Number(form.purchaseUnitFactor) <= 0)) {
      errors.purchaseUnit = t.inventoryItemForm.errPurchaseUnitFactor;
    }

    return errors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const threshold = form.lowStockThreshold.trim();
    const purchaseUnitLabel = form.purchaseUnitLabel.trim();
    const purchaseUnitFactor = form.purchaseUnitFactor.trim();

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        unit: form.unit,
        purchaseUnitLabel: purchaseUnitLabel === "" ? null : purchaseUnitLabel,
        purchaseUnitFactor: purchaseUnitFactor === "" ? null : Number(purchaseUnitFactor),
        lowStockThreshold: threshold === "" ? null : Number(threshold),
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.inventoryItemForm.errSave);
      setSaving(false);
    }
  }

  return (
    <AdminModal
      title={item ? t.inventoryItemForm.editTitle : t.inventoryItemForm.createTitle}
      onClose={onCancel}
      width="sm"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        <div>
          <label className={fieldLabelClass} htmlFor="itemName">
            {t.inventoryItemForm.name}
          </label>
          <input
            id="itemName"
            className={`${fieldInputClass} ${fieldErrors.name ? fieldInputErrorClass : ""}`}
            value={form.name}
            onChange={update("name")}
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name ? <FieldError id="itemName-error">{fieldErrors.name}</FieldError> : null}
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="itemUnit">
            {t.inventoryItemForm.unit}
          </label>
          <select
            id="itemUnit"
            className={fieldInputClass}
            value={form.unit}
            onChange={(event) =>
              setForm((current) => ({ ...current, unit: event.target.value as InventoryUnit }))
            }
          >
            {INVENTORY_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={fieldLabelClass}>{t.inventoryItemForm.purchaseUnit}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                aria-label={t.inventoryItemForm.purchaseUnitLabel}
                placeholder={t.inventoryItemForm.purchaseUnitLabelPlaceholder}
                className={`${fieldInputClass} ${fieldErrors.purchaseUnit ? fieldInputErrorClass : ""}`}
                value={form.purchaseUnitLabel}
                onChange={update("purchaseUnitLabel")}
              />
            </div>
            <div>
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                aria-label={t.inventoryItemForm.purchaseUnitFactor}
                placeholder={t.inventoryItemForm.purchaseUnitFactorPlaceholder(form.unit)}
                className={`${fieldInputClass} [font-variant-numeric:tabular-nums] ${
                  fieldErrors.purchaseUnit ? fieldInputErrorClass : ""
                }`}
                value={form.purchaseUnitFactor}
                onChange={update("purchaseUnitFactor")}
              />
            </div>
          </div>
          {fieldErrors.purchaseUnit ? (
            <FieldError id="purchaseUnit-error">{fieldErrors.purchaseUnit}</FieldError>
          ) : (
            <p className="mt-1.5 text-[0.75rem] text-on_surface/50">{t.inventoryItemForm.purchaseUnitHint}</p>
          )}
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="itemThreshold">
            {t.inventoryItemForm.lowStockThreshold}
          </label>
          <input
            id="itemThreshold"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            className={`${fieldInputClass} [font-variant-numeric:tabular-nums]`}
            value={form.lowStockThreshold}
            onChange={update("lowStockThreshold")}
          />
          <p className="mt-1.5 text-[0.75rem] text-on_surface/50">
            {t.inventoryItemForm.lowStockThresholdHint}
          </p>
        </div>

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex justify-end gap-2 border-t border-outline_variant pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t.common.saving : item ? t.inventoryItemForm.save : t.inventoryItemForm.create}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
