"use client";

import { useEffect, useState } from "react";
import type { AdminCategory, AdminProduct, ProductInput } from "@/lib/api";
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
import { ProductImageField } from "./ProductImageField";

interface Props {
  categories: AdminCategory[];
  /** Editing an existing product, or null when creating a new one. */
  product: AdminProduct | null;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}

interface FormState {
  categoryId: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  price: string;
  image: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function initialState(product: AdminProduct | null, categories: AdminCategory[]): FormState {
  return {
    categoryId: String(product?.categoryId ?? categories[0]?.id ?? ""),
    nameTr: product?.name.tr ?? "",
    nameEn: product?.name.en ?? "",
    descriptionTr: product?.description.tr ?? "",
    descriptionEn: product?.description.en ?? "",
    // Not toFixed(2): the panel writes ₺600, not ₺600.00, and a form that
    // shows trailing zeros invites someone to retype the whole number.
    price: product ? String(product.price) : "",
    image: product?.image ?? "",
  };
}

export function ProductFormModal({ categories, product, onCancel, onSubmit }: Props) {
  const { t, lang } = useAdminLang();
  const [form, setForm] = useState<FormState>(() => initialState(product, categories));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialState(product, categories));
    setFieldErrors({});
    setError("");
  }, [product, categories]);

  const update = (field: keyof FormState) => (event: { target: { value: string } }) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    // Clearing on edit rather than on re-submit, so the form stops shouting at
    // you about something you are in the middle of fixing.
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const price = Number(form.price);

    if (!form.nameTr.trim()) errors.nameTr = t.productForm.errNameTr;
    if (!form.nameEn.trim()) errors.nameEn = t.productForm.errNameEn;
    if (!form.image.trim()) errors.image = t.productForm.errImage;
    if (!form.price.trim() || Number.isNaN(price) || price < 0) {
      errors.price = t.productForm.errPrice;
    }
    if (!form.categoryId) errors.categoryId = t.productForm.errCategory;

    return errors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(t.productForm.fixFields);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        categoryId: Number(form.categoryId),
        name: { tr: form.nameTr.trim(), en: form.nameEn.trim() },
        description: { tr: form.descriptionTr.trim(), en: form.descriptionEn.trim() },
        price: Number(form.price),
        image: form.image.trim(),
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.productForm.errSave);
      setSaving(false);
    }
  }

  /** Wires a field to its error message for both the eye and a screen reader. */
  const fieldProps = (field: keyof FormState) => ({
    className: `${fieldInputClass} ${fieldErrors[field] ? fieldInputErrorClass : ""}`,
    "aria-invalid": fieldErrors[field] ? true : undefined,
    "aria-describedby": fieldErrors[field] ? `${field}-error` : undefined,
  });

  return (
    <AdminModal
      title={product ? t.productForm.editTitle : t.productForm.createTitle}
      subtitle={product ? product.name[lang] : undefined}
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="nameTr">
              {t.productForm.nameTr}
            </label>
            <input id="nameTr" {...fieldProps("nameTr")} value={form.nameTr} onChange={update("nameTr")} />
            {fieldErrors.nameTr ? (
              <FieldError id="nameTr-error">{fieldErrors.nameTr}</FieldError>
            ) : null}
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="nameEn">
              {t.productForm.nameEn}
            </label>
            <input id="nameEn" {...fieldProps("nameEn")} value={form.nameEn} onChange={update("nameEn")} />
            {fieldErrors.nameEn ? (
              <FieldError id="nameEn-error">{fieldErrors.nameEn}</FieldError>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="descriptionTr">
              {t.productForm.descriptionTr}
            </label>
            <textarea
              id="descriptionTr"
              rows={3}
              className={fieldInputClass}
              value={form.descriptionTr}
              onChange={update("descriptionTr")}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="descriptionEn">
              {t.productForm.descriptionEn}
            </label>
            <textarea
              id="descriptionEn"
              rows={3}
              className={fieldInputClass}
              value={form.descriptionEn}
              onChange={update("descriptionEn")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="categoryId">
              {t.productForm.category}
            </label>
            <select
              id="categoryId"
              {...fieldProps("categoryId")}
              value={form.categoryId}
              onChange={update("categoryId")}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name[lang]}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId ? (
              <FieldError id="categoryId-error">{fieldErrors.categoryId}</FieldError>
            ) : null}
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="price">
              {t.productForm.price}
            </label>
            <div className="relative">
              {/* The currency belongs to the field, not to the label — you are
                  typing an amount, and the unit should sit where you look. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-on_surface/40"
              >
                ₺
              </span>
              <input
                {...fieldProps("price")}
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={`${fieldProps("price").className} pl-7 [font-variant-numeric:tabular-nums]`}
                value={form.price}
                onChange={update("price")}
              />
            </div>
            {fieldErrors.price ? (
              <FieldError id="price-error">{fieldErrors.price}</FieldError>
            ) : null}
          </div>
        </div>

        <div>
          <ProductImageField
            value={form.image}
            invalid={Boolean(fieldErrors.image)}
            errorId="image-error"
            onChange={(path) => {
              setForm((current) => ({ ...current, image: path }));
              setFieldErrors((current) => {
                if (!current.image) return current;
                const next = { ...current };
                delete next.image;
                return next;
              });
            }}
          />
          {fieldErrors.image ? (
            <FieldError id="image-error">{fieldErrors.image}</FieldError>
          ) : null}
        </div>

        {product ? (
          <p className="text-[0.75rem] text-on_surface/45">
            {t.productForm.slugNoteExisting(product.slug)}
          </p>
        ) : null}

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-outline_variant pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} className="sm:w-auto">
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t.common.saving : product ? t.productForm.save : t.productForm.create}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
