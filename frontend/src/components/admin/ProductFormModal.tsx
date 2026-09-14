"use client";

import { useEffect, useState } from "react";
import type { AdminCategory, AdminProduct, ProductInput } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, fieldInputClass, fieldLabelClass } from "./AdminUI";

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

function initialState(product: AdminProduct | null, categories: AdminCategory[]): FormState {
  return {
    categoryId: String(product?.categoryId ?? categories[0]?.id ?? ""),
    nameTr: product?.name.tr ?? "",
    nameEn: product?.name.en ?? "",
    descriptionTr: product?.description.tr ?? "",
    descriptionEn: product?.description.en ?? "",
    price: product ? product.price.toFixed(2) : "",
    image: product?.image ?? "",
  };
}

export function ProductFormModal({ categories, product, onCancel, onSubmit }: Props) {
  const { t, lang } = useAdminLang();
  const [form, setForm] = useState<FormState>(() => initialState(product, categories));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialState(product, categories));
    setError("");
  }, [product, categories]);

  const update = (field: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const price = Number(form.price);
    if (!form.nameTr.trim() || !form.nameEn.trim()) {
      setError(t.productForm.errNames);
      return;
    }
    if (!form.image.trim()) {
      setError(t.productForm.errImage);
      return;
    }
    if (!form.price.trim() || Number.isNaN(price) || price < 0) {
      setError(t.productForm.errPrice);
      return;
    }
    if (!form.categoryId) {
      setError(t.productForm.errCategory);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        categoryId: Number(form.categoryId),
        name: { tr: form.nameTr.trim(), en: form.nameEn.trim() },
        description: { tr: form.descriptionTr.trim(), en: form.descriptionEn.trim() },
        price,
        image: form.image.trim(),
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.productForm.errSave);
      setSaving(false);
    }
  }

  return (
    <AdminModal
      title={product ? t.productForm.editTitle : t.productForm.createTitle}
      subtitle={product ? product.name[lang] : undefined}
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="nameTr">
              {t.productForm.nameTr}
            </label>
            <input id="nameTr" className={fieldInputClass} value={form.nameTr} onChange={update("nameTr")} />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="nameEn">
              {t.productForm.nameEn}
            </label>
            <input id="nameEn" className={fieldInputClass} value={form.nameEn} onChange={update("nameEn")} />
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
              className={fieldInputClass}
              value={form.categoryId}
              onChange={update("categoryId")}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="price">
              {t.productForm.price}
            </label>
            <input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={fieldInputClass}
              value={form.price}
              onChange={update("price")}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="image">
            {t.productForm.image}
          </label>
          <input
            id="image"
            className={fieldInputClass}
            placeholder="/menu/products/Example.png"
            value={form.image}
            onChange={update("image")}
          />
        </div>

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex justify-end gap-2 border-t border-outline_variant pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
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
